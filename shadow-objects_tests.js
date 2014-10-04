var itemSchema = {
	name: 'item'
};
var personSchema = {
	name: 'person'
	, schema: {
		name: [function (val) {return _.isString(val);}]
		, age: []
		, zip: []
	}
};
var bankSchema = {
	name: 'bank'
	, schema: {
		routingNumber: []
		, employees: {
			isArray: true
			, schema: personSchema.schema
		}
		, items: {
			isArray: true
		}
		, safe: {
			combination: []
		}
	}
};
var namesSchema = {
	name: 'name list'
	, isArray: true
};
var peopleSchema = {
	name: 'people'
	, isArray: true
	, schema: personSchema.schema
};

Tinytest.add('Shadow Objects - basic api - value helper', function (test) {
	var item = new ShadowObject(itemSchema, 'joe');
	test.equal(item._.value(), 'joe');

	item._.value('sam');
	test.equal(item._.value(), 'sam');

	item = new ShadowObject(personSchema, {name: 'joe'});
	test.equal(item._.value().name, 'joe');
	// The object has 3 properties, but we also expect the _ property
	test.equal(_.keys(item._.value()).length, 4);
});
Tinytest.add('Shadow Objects - basic api - clone helper', function (test) {
	var item = new ShadowObject(itemSchema, 'joe');
	test.equal(item._.clone(), 'joe');

	item._.value('sam');
	test.equal(item._.clone(), 'sam');

	item = new ShadowObject(personSchema, {name: 'joe'});
	test.equal(item._.clone().name, 'joe');
	// This object should only include keys specified in the schema
	test.equal(_.keys(item._.clone()).length, 3);
});
Tinytest.add('Shadow Objects - basic api - shadow helper', function (test) {
	var item = new ShadowObject(itemSchema, 'joe');
	test.equal(item._(), 'joe');

	item._('sam');
	test.equal(item._(), 'sam');

	item = new ShadowObject(personSchema, {name: 'joe'});
	test.equal(item._().name, 'joe');
	// This object should only include keys specified in the schema
	test.equal(_.keys(item._()).length, 3);
});

Tinytest.add('Shadow Objects - basic api - object with properties', function (test) {
	// We've already tested most of this functionality in the previous three tests...
});
Tinytest.add('Shadow Objects - basic api - object with arrays', function (test) {
	var item = new ShadowObject(bankSchema);
	test.instanceOf(item.employees, Array);

	item.employees.push({});

	test.equal(item.employees[0].name, undefined);

	item.employees[0].name = "Joe";

	test.equal(item.employees[0].name, "Joe");
});
Tinytest.add('Shadow Objects - basic api - object with objects', function (test) {
	var item = new ShadowObject(bankSchema);
	test.instanceOf(item.safe, Object);
	item.safe.combination = "Joker";
	test.equal(item.safe.combination, "Joker");
});
Tinytest.add('Shadow Objects - basic api - array with properties', function (test) {
	var item = new ShadowObject(namesSchema);

	test.instanceOf(item, Array);
	test.equal(item.length, 0);

	item.push("Sam");
	test.equal(item.length, 1);
	test.equal(item[0], "Sam");

	item[0] = "George";
	test.equal(item.length, 1);
	test.equal(item[0], "George");

	item._(["Peter", "William", "George"]);
	test.equal(item.length, 3);
	test.equal(item[0], "Peter");

	item._(["Peter"]);
	test.equal(item.length, 1);
	test.equal(item[0], "Peter");
	test.equal(item[1], undefined);

	item.pop();
	test.equal(item.length, 0);
	test.equal(item[0], undefined);
});
Tinytest.add('Shadow Objects - basic api - array with objects', function (test) {
	var item = new ShadowObject(peopleSchema);

	test.instanceOf(item, Array);
	test.equal(item.length, 0);

	item.push({});

	test.isTrue(item[0].hasOwnProperty('name'));
	test.isTrue(item[0].hasOwnProperty('age'));
	test.isTrue(item[0].hasOwnProperty('zip'));

	item[0].name = "sam";
	test.equal(item[0]._().name, "sam");

	var oldVal = item[0];
	item[0] = {};
	var newVal = item[0];

	test.equal(oldVal, newVal);
	test.equal(oldVal.name, undefined);
});

Tinytest.add('Shadow Objects - static helpers - item.original', function (test) {
	var item = new ShadowObject(itemSchema, "original");

	test.equal(item._.original, "original");
});

Tinytest.add('Shadow Objects - static helpers - object.original', function (test) {
	var item = new ShadowObject(personSchema, {name:"original"});

	test.equal(item._.original.name, "original");
	test.equal(item._.shadow["name"]._.original, "original");
});

Tinytest.add('Shadow Objects - static helpers - array.original', function (test) {
	var item = new ShadowObject(namesSchema, ["original"]);

	test.equal(item._.original[0], "original");
	test.equal(item._.shadow["0"]._.original, "original");
});

Tinytest.add('Shadow Objects - static helpers - deep.original', function (test) {
	var item = new ShadowObject(bankSchema, {
		employees: [
			{
				name: 'original'
			}
		]
		, safe: {
			combination: 'original'
		}
	});

	test.equal(item._.original.employees[0].name, "original");
	test.equal(item._.original.safe.combination, "original");
	test.equal(item.employees[0]._.shadow["name"]._.original, "original");
	test.equal(item.safe._.shadow["combination"]._.original, "original");
});

Tinytest.add('Shadow Objects - static helpers - undefined.original', function (test) {
	var item = new ShadowObject(bankSchema, null);

	// test.equal(item._.original.employees[0].name, "original");
	// test.equal(item._.original.safe.combination, "original");
	test.equal(item.employees._.original, undefined);
	test.equal(item.safe._.shadow["combination"]._.original, undefined);
});

// XXX write tests for schema

Tinytest.add('Shadow Objects - helpers - item.hasChanges', function (test) {
	var item = new ShadowObject(itemSchema, "original");

	test.isFalse(item._.hasChanges());

	item._('new');

	test.isTrue(item._.hasChanges());
});

Tinytest.add('Shadow Objects - helpers - object.hasChanges', function (test) {
	var item = new ShadowObject(personSchema, {name:"original"});

	test.isFalse(item._.hasChanges());

	item.name = 'new';

	test.isTrue(item._.hasChanges());
});

Tinytest.add('Shadow Objects - helpers - object.changes', function (test) {
	var item = new ShadowObject(personSchema, {name:"original"});

	test.equal(_.keys(item._.changes()).length, 0);

	item.name = 'new';

	test.equal(_.keys(item._.changes()).length, 1);
	test.equal(item._.changes().name, 'new');
});

Tinytest.add('Shadow Objects - helpers - array.hasChanges', function (test) {
	var item = new ShadowObject(namesSchema, ["original"]);

	test.isFalse(item._.hasChanges());

	item[0] = 'new';

	test.isTrue(item._.hasChanges());
});

Tinytest.add('Shadow Objects - helpers - deep.hasChanges', function (test) {
	var item = new ShadowObject(bankSchema, {
		employees: [
			{
				name: 'original'
			}
		]
		, safe: {
			combination: 'original'
		}
	});

	test.isFalse(item._.hasChanges());

	item.employees[0].name = 'new';

	test.isTrue(item._.hasChanges());
});

Tinytest.add('Shadow Objects - helpers - undefined.hasChanges', function (test) {
	var item = new ShadowObject(bankSchema);

	test.isFalse(item._.hasChanges());

	item.employees.push({});

	test.isTrue(item._.hasChanges());
});

Tinytest.add('Shadow Objects - helpers - root', function (test) {
	var item = new ShadowObject(bankSchema);

	test.equal(item._.root(), item);
	test.equal(item.employees._.root(), item);
	test.equal(item.safe._.root(), item);
	test.equal(item.safe._.shadow.combination._.root(), item);
});

Tinytest.add('Shadow Objects - helpers - reset', function (test) {
	var item = new ShadowObject(bankSchema, {
		employees: [
			{
				name: 'original'
			}
		]
		, safe: {
			combination: 'original'
		}
	});

	var newItem = {
		employees: [
			{
				name: 'new'
			}
			, {
				name: 'new'
			}
		]
		, safe: {
			combination: 'new'
		}
	};
	item._.resetOriginal(newItem);

	test.equal(item._.original, newItem);
	test.equal(item.employees._.original.length, 2);
	test.equal(item.employees.length, 2);
	test.equal(item.employees[0]._.original.name, 'new');
	test.equal(item.employees[0].name, 'new');
	test.equal(item.safe._.original.combination, 'new');
	test.equal(item.safe.combination, 'new');

});

// XXX write reactivity tests for hasChanges

Tinytest.add('Shadow Objects - reactivity - property is reactive', function (test) {
	var item = new ShadowObject(itemSchema)
		, nextValue
		, autoRunCount = 0;

	var comp = Deps.autorun(function () {
		autoRunCount++;
		test.equal(item._(), nextValue);
	});

	Deps.flush();

	nextValue = "Joker";
	item._(nextValue);

	Deps.flush();

	nextValue = "Sammy";
	item._.value(nextValue);

	Deps.flush();

	test.equal(autoRunCount, 3);
});
Tinytest.add('Shadow Objects - reactivity - property does not trigger changed for dates', function (test) {
	var item = new ShadowObject(itemSchema)
		, nextValue
		, autoRunCount = 0;

	var comp = Deps.autorun(function () {
		autoRunCount++;
		test.equal(item._(), nextValue);
	});

	Deps.flush();

	nextValue = new Date();
	item._(nextValue);

	Deps.flush();

	nextValue = new Date(nextValue.valueOf());
	item._.value(nextValue);

	Deps.flush();

	test.equal(autoRunCount, 2);
});
Tinytest.add('Shadow Objects - reactivity - object is reactive', function (test) {
	var item = new ShadowObject(personSchema)
		, nextValue
		, autoRunCount = 0;

	var comp = Deps.autorun(function () {
		autoRunCount++;
		test.equal(item.name, nextValue);
	});

	Deps.flush();

	nextValue = "Joker";
	item.name = nextValue;

	Deps.flush();

	nextValue = "Sammy";
	item._.value({
		name: nextValue
	});

	Deps.flush();

	test.equal(autoRunCount, 3);
});
Tinytest.add('Shadow Objects - reactivity - array object is reactive', function (test) {
	var item = new ShadowObject(peopleSchema, [{}])
		, nextValue
		, autoRunCount = 0;

	var comp = Deps.autorun(function () {
		autoRunCount++;
		test.equal(item[0].name, nextValue);
	});

	Deps.flush();

	nextValue = "Joker";
	item[0].name = nextValue;

	Deps.flush();

	nextValue = "Sammy";
	item[0] = {
		name: nextValue
	};

	Deps.flush();

	test.equal(autoRunCount, 3);
});
Tinytest.add('Shadow Objects - reactivity - array is reactive', function (test) {
	var item = new ShadowObject(peopleSchema, [])
		, nextValue = 0
		, autoRunCount = 0;

	var comp = Deps.autorun(function () {
		autoRunCount++;
		test.equal(item._().length, nextValue);
	});

	Deps.flush();

	nextValue = 1;
	item.push({});

	Deps.flush();

	nextValue = 3;
	item._([{},{},{}]);

	Deps.flush();

	nextValue = 1;
	item._([{}]);
	Deps.flush();

	nextValue = 0;
	item.pop();
	Deps.flush();

	test.equal(autoRunCount, 5);
});

Tinytest.add('Shadow Objects - reactivity - setters do not create circular dependencies', function (test) {
	var item;
	var employees;
	var counter = 0;
	// each element is a function which calls a setter,
	// if the setter does not create a circular dependency, the autorun will not
	// be called again.
	_.each([
		function () {item = new ShadowObject(bankSchema, {employees: [{}]});}
		, function () {employees = item.employees;}
		, function () {item._({});}
		, function () {item._({routingNumber: counter++});}
		, function () {item.routingNumber = counter++;}
		, function () {item.employees = [];}
		, function () {item.employees = [{name: counter++}];}
		, function () {item.employees[0].name = counter++;}
		// we can't avoid these two being reactive without
		// loosing the reactivity of the employees array when it is 
		// accessed directly (in other words we can't tell the difference
		// between item.employees.forEach() and item.employees.push because they
		// both access the employees property of item)
		// , function () {item.employees.push({});}
		// , function () {item.employees.push({name: counter++});}
		// we still want the push method to be non-reactive:
		, function () {employees.push({});}
		, function () {employees.push({name: counter++});}
		, function () {item.safe = {};}
		, function () {item.safe = {combination: counter++};}
		, function () {item.safe.combination = counter++;}
		, function () {item._.resetOriginal({safe: {combination: counter++}});}
		, function () {item._.resetOriginal({items: [{name: counter++}]});}
		], function (fn) {
			var depCount = 0;
			Deps.autorun(function () {
				if (depCount < 5) {
					fn();
				}
				depCount++;
			});

			Deps.flush();

			fn();

			Deps.flush();

			test.equal(depCount, 1);			
		});



});

Tinytest.add('Shadow Objects - extensibility - shadow is extensible', function (test) {
	ShadowObject.shadow.fn.helper2 = function () {
		return this.self.x;
	};
	var item = new ShadowObject(itemSchema);
	test.equal(item._.helper2(), undefined);
	item.x = 'sam';
	test.equal(item._.helper2(), 'sam');
});
Tinytest.add('Shadow Objects - extensibility - object is extensible', function (test) {
	ShadowObject.object.fn.helper = function () {
		return '5';
	};
	var item = new ShadowObject(personSchema);
	test.equal(item._.helper(), '5');
});
Tinytest.add('Shadow Objects - extensibility - property is extensible', function (test) {
	ShadowObject.property.fn.helper = function () {
		return '6';
	};
	var item = new ShadowObject(itemSchema);
	test.equal(item._.helper(), '6');
});
Tinytest.add('Shadow Objects - extensibility - array is extensible', function (test) {
	ShadowObject.array.fn.helper = function () {
		return '7';
	};
	var item = new ShadowObject(peopleSchema);
	test.equal(item._.helper(), '7');
});

Tinytest.add('Shadow Objects - schema helpers - errors helper', function (test) {
	var item = new ShadowObject(personSchema);
	test.isTrue(!!item._.errors()[0]);

});
Tinytest.add('Shadow Objects - schema helpers - check helper', function (test) {
	var item = new ShadowObject(personSchema);
	test.throws(function () {
		item._.check();
	});

});
Tinytest.add('Shadow Objects - schema helpers - match helper', function (test) {
	var item = new ShadowObject(personSchema);
	test.equal(item._.match(), false);

});