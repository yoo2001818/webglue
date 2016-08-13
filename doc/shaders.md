# Shaders
Some shaders may use `#define` to set the light size, or features.
There are few types of that, mainly:

- Feature definition. Mainly boolean.
- Number definition. It should have max limit (Since there is uniform budget
  limit), and it should adaptively changed because it affects the performance.
  Maybe some kind of 'governor' should be implemented.
- Capability definition. Anisotropic filtering, standard derivatives, etc.
