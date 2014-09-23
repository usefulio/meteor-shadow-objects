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

	item._(["Peter", "William"]);
	test.equal(item.length, 2);
	test.equal(item[0], "Peter");
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

	test.equal(autoRunCount, 3);
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