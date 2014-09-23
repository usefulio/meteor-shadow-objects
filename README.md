Shadow Objects
=====================

Reactive javascript objects for meteor

Creates reactive objects which conform to a defined schema. The (schema defined) properties of this object are reactive using ECMAScript getters and setters.

    // Create an object
    // (see https://github.com/cwohlman/meteor-validation-schema for more info on defining the schema)
    var myObject = new ShadowObject({name: 'some schema name', schema: {name: [], age: [], zip: []}});
    
    // use the object's properties in a reactive context
    Deps.autorun(function () {
        console.log('name', myObject.name);
    });
    
    // the computation is run for the first time printing:
    // name undefined
    
    // modify the property
    myObject.name = 'Mr. Nice Guy';
    
    // the computation is rerun printing the new name to the console:
    // name Mr. Nice Guy

The `ShadowObject` constructor can handle any value that can be described by a schema including deeply nested objects and arrays

An interesting side effect of the ShadowObject is the permenant existance of all properties

    myObject.hasOwnProperty('age') // true
    
    var otherObject = new ShadowObject({name: 'other schema name', schema: {
        subDocument: {
            name: []
        }
        , deepDocument: {
            subDocument: {
                name: []
            }
        }
    }});
    
    // neither of these statements throw an error:
    console.log('name', otherObject.subDocument.name)
    console.log('deep name', otherObject.deepDocument.subDocument.name)
    
Arrays work well:

    var arrayParent = new ShadowObject({name: 'array schema name', schema: {
        children: {
            isArray: true
            , schema: {
                name: []
                , age: []
            }
        }
    }});
    
    Deps.autorun(function () {console.log('children', arrayParent.children)})
    
    arrayParent.children.push({name: "Jonny"}); // logs children [{name: "Jonny"}]
    
    Deps.autorun(function () {console.log('child', arrayParent.children[0])})
    
    arrayParent.children[0] = {age: 12} // logs child {age: 12}
    
A couple of imporant notes:
* Arrays are not as reactive as they look: elements beyond the current length of the array have not been instantiated and setting them does not have a defined effect. (You need to use a built in array modifier to instantiate them first)

        // this will not work
        arrayParent.children[1] = {};
        
        // do this instead
        arrayParent.children.push({});
        
        // this is now valid
        arrayParent.children[1] = {name: 'joe'}
        
* Getters and setters are stingy with reactivity, they attempt to invalidate or depend on as few dependencies as possible. This may lead to unexpected results

        Deps.autorun(function () {console.log(otherObject.subDocument)});
        
        // does not cause the above computation to rerun
        otherObject.subDocument.name = 'joe';
        
        // Instead explicity depend on the whole object
        Deps.autorun(function () {console.log(otherObject.subDocument._())});
        
        // will be rerun when any child property is changed
        otherObject.subDocument.name = 'sam';

* We use a reactiveVar for each object property to avoid deps invalidations when nothing has changed
* Last but not least, the schema is not optional: ShadowObject will not create reactivity for any property not defined in the schema.

API
=====================

`ShadowObject(schema, original)` constructor for shadow objects. Takes two arguments:
 - schema defines the properties on an object. Should be an instance of Schema or an object which will be passed to the Schema constructor
 - original (optional) starting value for the object will be used to populate any fields defined in the schema

The shadow object constructor returns one of three kinds of objects:

 - `object` - looks just like a javascript object, created with getters and setters for every property defined in the schema.
 - `array` - looks just like a javascript array, array prototype methods have been overridden to create getters and setters for any array element indexes created as a result of the operation.
 - `property` - an instance of ReactiveVar, this kind of shadow object is used internally to hold the value of an object's property.
 
All shadow object instances provide an `_` property for accessing helpers and ShadowObject functionality. The underscore is the only reserved property name in a shadow object, any other property is valid and may be specified in the schema.

 - `myShadowObject._()` - returns a plain javascript clone of the object. You can use this method if you need to get the entire object value reactively, calling this function registers dependencies for every property on the object.
 - `myShadowObject._(val)` - 'sets' the object, replacing the values of all properties in the shadow object with values in `val`. This function's internal behavior is slightly different depending on the kind of shadow object, but is essentially the same across all three kinds of shadow object.
 - `myShadowObject._.value()` - mainly for internal use: returns the current value of this shadow object, for both arrays and objects `myShadowObject._.value() === myShadowObject`, for shadow properties `myShadowObject._.value()` returns `myShadowObject.get()`.
 - `myShadowObject._.value(val)` - set's the value of the current object. `myShadowObject._(val)` is an alias for this method.
 - `myShadowObject._.clone()` - returns a plain javascript clone of the object. `myShadowObject._()` is an alias for this method
 
The shadow object api is extensible, you can extend any one or all three kinds of shadow objects by adding helpers to the fn object:
 - `ShadowObject.shadow.fn` - helpers defined here are accessible on all shadows objects:
        
        ShadowObject.shadow.fn.myHelper = function () {return 'todo'}
        
        x = new ShadowObject({})
        x._.myHelper() // 'todo'
        
 - `ShadowObject.*.fn` - each shadow object kind ('object', 'array', and 'property') also provides a fn object for extending the helper object.
 
        ShadowObject.object.fn.myObjectHelper = function () {return 'object'}
        
        x = new ShadowObject({name: 'object schema', schema: {name: []}});
        x._.myObjectHelper() // 'object'
        
        ShadowObject.array.fn.myArrayHelper = function () {return 'array'}
        
        x = new ShadowObject({name: 'array schema', isArray: true});
        x._.myArraytHelper() // 'array'
        
        ShadowObject.property.fn.myPropertyHelper = function () {return 'property'}
        
        x = new ShadowObject({});
        x._.myPropertyHelper() // 'property'
