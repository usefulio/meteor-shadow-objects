Package.describe({
  summary: "Implements 'shadow objects', objects which mimic plain javascript objects but which have reactive properties."
});

Package.on_use(function (api, where) {
  api.use(['schema', 'reactive-var', 'ui']);

  api.add_files('shadow-objects.js', ['client', 'server']);

  api.export('ShadowObject');
});

Package.on_test(function (api) {
  api.use('shadow-objects');
  api.use(['tinytest', 'test-helpers']);

  api.add_files('shadow-objects_tests.js', ['client', 'server']);
});
