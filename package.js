Package.describe({
  summary: "Reactive objects using getters and setters."
  , name: "cwohlman:shadow-objects"
  , version: "0.1.1"
  , git: "https://github.com/cwohlman/meteor-shadow-objects.git"
  , 
});

Package.on_use(function (api, where) {
  api.versionsFrom("0.9.0");
  
  api.use(['cwohlman:schema@0.1.0', 'reactive-var@1.0.2', 'ui']);

  api.add_files('shadow-objects.js', ['client', 'server']);

  api.export('ShadowObject');
});

Package.on_test(function (api) {
  api.use('cwohlman:shadow-objects');
  api.use(['tinytest', 'test-helpers']);

  api.add_files('shadow-objects_tests.js', ['client', 'server']);
});
