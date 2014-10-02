Package.describe({
  summary: "Implements 'shadow objects', objects which mimic plain javascript objects but which have reactive properties."
  , name: "cwohlman:shadow-objects"
  , version: "0.1.0"
  , git: "https://github.com/cwohlman/meteor-shadow-objects.git"
  , 
});

Package.on_use(function (api, where) {
  api.versionsFrom("0.9.0");
  
  api.use(['cwohlman:schema@0.1.0', 'reactive-var', 'ui']);

  api.add_files('shadow-objects.js', ['client', 'server']);

  api.export('ShadowObject');
});

Package.on_test(function (api) {
  api.use('cwohlman:shadow-objects');
  api.use(['tinytest', 'test-helpers']);

  api.add_files('shadow-objects_tests.js', ['client', 'server']);
});
