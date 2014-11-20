ShadowObject = function (schema, original) {
	schema = schema instanceof Schema ? schema : new Schema(schema);

	var shadow = ShadowObject.shadow()
		, result
		, constructor;

	_.extend(shadow, ShadowObject.shadow.fn);
	shadow.schema = schema;
	shadow.original = original;

	if (schema.isArray) {
		constructor = ShadowObject.array;
	} else if (schema.isDict) {
		constructor = ShadowObject.dict;
	} else if (schema.schema) {
		constructor = ShadowObject.object;
	} else {
		constructor = ShadowObject.property;
	}

	_.extend(shadow, constructor.fn);
	result = constructor(schema, shadow);

	result._ = shadow;
	shadow.self = result;

	Deps.nonreactive(function () {
		result._(original);
	});

	return result;
};

ShadowObject.shadow = function () {
	return function (val) {
		if (arguments.length) {
			this._.value(val);
		} else {
			return this._.clone();
		}
	};
};

// properties of this object are helpers, they will be attached
// to the _ property of the newly created shadow object
ShadowObject.shadow.fn = {
	check: function () {
		return this.schema.check(this.self._(), this.root());
	}
	, errors: function () {
		return this.schema.errors(this.self._(), this.root(), []);
	}
	, match: function () {
		return this.schema.match(this.self._(), this.root());
	}
	, root: function () {
		var parent = this;
		while (parent.parent) {
			parent = parent.parent._;
		}
		return parent.self;
	}
	, resetOriginal: function (original) {
		// allow for no arguments to signal reseting the object to it's original state
		if (!arguments.length) {
			original = this.original;
		}
		this.original = original;
		// in case original is null or undefined
		original = original || {};
		if (this.properties) {
			_.each(this.properties, function (prop) {
				this.shadow[prop]._.resetOriginal(original[prop]);
			}, this);
		}
		this.value(original);
	}
};

ShadowObject.property = function (schema, shadow) {
	return new ReactiveVar(undefined, _.isEqual);
};

ShadowObject.property.fn = {
	clone: function () {
		return this.value();
	}
	, value: function (val) {
		if (arguments.length) {
			this.self.set(val);
		} else {
			return this.self.get();
		}
	}
	, hasChanges: function () {
		return !_.isEqual(this.self.get(), this.original);
	}
};

// this is a constructor and returns the core value
ShadowObject.object = function (schema, shadow, original) {
	var result = {};
	original = original || {};
	_.each(schema.schema, function (schema, prop) {
		this.addProperty(result, prop, schema, original[prop]);
	}, shadow);
	return result;
};

ShadowObject.object.fn = {
	clone: function () {
		var result = {};
		_.each(this.properties, function (prop) {
			result[prop] = this.shadow[prop]._();
		}, this);
		return result;
	}
	, value: function (val) {
		if (arguments.length) {
			val = _.isObject(val) ? val : {};
			_.each(this.properties, function (prop) {
				this.self[prop] = val[prop];
			}, this);
		} else {
			return this.self;
		}
	}
	, addProperty: function (self, prop, schema, original) {
		// Lazily instantiate the necessary properties
		this.shadow = this.shadow || {};
		this.properties = this.properties || [];

		this.properties.push(prop);

		var shadow = this.shadow[prop] = new ShadowObject(schema, original || (this.original || {})[prop]);

		shadow._.parent = self;
		// shadow._.root = self._.root || self._;

		Object.defineProperty(self, prop, {
			// allows array elements to be deleted
			configurable: true
			, enumerable: true
			, get: function () {
				return shadow._.value();
			}
			, set: function (val) {
				shadow._.value(val);
			}
		});
	}
	, hasChanges: function () {
		return _.any(this.properties, function (prop) {
			return this.shadow[prop]._.hasChanges();
		}, this);
	}
	, changes: function () {
		var result = {};
		_.each(this.properties, function (prop) {
			if (this.shadow[prop]._.hasChanges()) {
				result[prop] = this.shadow[prop]._();
			}
		}, this);
		return result;
	}
};

ShadowObject.array = function (schema, shadow, original) {
	result = [];

	shadow.dep = new Deps.Dependency();

	shadow.childSchema = schema.toItemSchema();

	_.each(ShadowObject.array.arrayFunctions, function (prop) {
		result[prop] = function () {
			var self = this;
			var clone;
			Deps.nonreactive(function () {
				clone = self._();
			});
			var result = Array.prototype[prop].apply(clone, arguments);
			this._(clone);
			return result;
		};
	});

	return result;
};

ShadowObject.array.fn = {
	clone: function () {
		var result = [];
		this.dep.depend();
		_.each(this.properties, function (prop) {
			result[prop] = this.shadow[prop]._();
		}, this);
		return result;
	}
	, value: function (val) {
		if (arguments.length) {
			val = _.isArray(val) ? val : [];

			// initialize any missing getters and setters;
			this.initElements(val);

			// transfer the properties over
			_.each(val, function (a, i) {
				this.self[i] = a;
			}, this);
		} else {
			this.dep.depend();
			return this.self;
		}
	}
	, initElements: function (val) {
		_.each(this.properties, function (i) {
			if (i >= val.length) {
				this.self.length = val.length;
				this.properties.length = val.length;
				delete this.self[i];
				delete this.properties[i];
				this.dep.changed();
			}
		}, this);
		_.each(val || this.shadow, function (a, i) {
			if (!_.contains(this.properties, i)) {
				this.addProperty(this.self, i, this.childSchema);
			}
		}, this);
	}
	, addProperty: function () {
		this.dep.changed();
		ShadowObject.object.fn.addProperty.apply(this, arguments);
	}
	, hasChanges: function () {
		this.dep.depend();
		return ShadowObject.object.fn.hasChanges.apply(this, arguments) || (this.self.length != (this.original || []).length);
	}
};

ShadowObject.array.arrayFunctions = [
	"pop"
	, "push"
	, "reverse"
	, "shift"
	, "sort"
	, "splice"
	, "unshift"
];

if (Meteor.isClient) {
	UI.registerHelper('_', function () {
		return this._;
	});
}
