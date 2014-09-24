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

	result._(original);

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
		return this.schema.check(this.self._());
	}
	, errors: function () {
		return this.schema.errors(this.self._());
	}
	, match: function () {
		return this.schema.match(this.self._());
	}
};

ShadowObject.property = function (schema, shadow) {
	return new ReactiveVar();
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
};

// this is a constructor and returns the core value 
ShadowObject.object = function (schema, shadow) {
	var result = {};
	_.each(schema.schema, function (schema, prop) {
		this.addProperty(result, prop, schema);
	}, shadow);
	return result;
};

ShadowObject.object.fn = {
	clone: function () {
		var result = {};
		_.each(this.properties, function (prop) {
			result[prop] = this.shadow[":" + prop]._();
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
	, addProperty: function (self, prop, schema) {
		// Lazily instantiate the necessary properties
		this.shadow = this.shadow || {};
		this.properties = this.properties || [];

		this.properties.push(prop);
		
		var shadow = this.shadow[":" + prop] = new ShadowObject(schema);

		shadow._.parent = self;

		self.__defineGetter__(prop, function () {
			return shadow._.value();
		});
		self.__defineSetter__(prop, function (val) {
			shadow._.value(val);
		});
	}
};

ShadowObject.array = function (schema, shadow) {
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
			result[prop] = this.shadow[":" + prop]._();
		}, this);
		return result;
	}
	, value: function (val) {
		if (arguments.length) {
			val = _.isArray(val) ? val : [];
			this.initElements(val);
			_.each(val, function (a, i) {
				this.self[i] = a;
			}, this);
		} else {
			this.dep.depend();
			return this.self;
		}
	}
	, initElements: function (val) {
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

