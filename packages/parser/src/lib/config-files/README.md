Intentions / Goals of configuration loader system:

- Easily implement the following configuration consumers:
  - Load configuration from static js / ts / json files
  - Load configuration from package.json
  - Load configuration via a custom function
- Regardless of how configuration is loaded, our return type should be the same
- Allow for `extends` functionality, where one configuration file can extend another

As much of this as possible should be abstracted away from the configuration loader itself, to make it easier to implement new configuration loaders in the future.
