# Contributing Guidelines

Thank you for your interest in contributing to our project! We welcome contributions from the community to help improve our project and make it even better.

This project proudly uses [Nx](https://nx.dev) to manage the repository and run tasks. If you are new to Nx, you can find more information in the [Nx documentation](https://nx.dev).

To ensure a smooth and collaborative contribution process, please follow these guidelines:

1. **Fork the repository**: Start by forking our repository to your own GitHub account.

2. **Clone the repository**: Clone the forked repository to your local machine using the following command:

   ```shell
   git clone https://github.com/your-username/cli-forge.git
   ```

3. **Create a new branch**: Create a new branch for your contribution using a descriptive name. This will help us understand the purpose of your changes.

   ```shell
   git checkout -b your-branch-name
   ```

4. **Make your changes**: Make the necessary changes or additions to the codebase. Ensure that your changes align with the project's coding conventions and style guidelines.

5. **Test your changes**: Before submitting your contribution, make sure to test your changes thoroughly to ensure they work as expected.
   To manually check your changes, examples in the `examples` directory can be run using the following command:

   ```shell
   cd examples
   npx tsx {example-name}.ts
   ```

   Run the tests using the following command:

   ```shell
   nx run-many -t test,e2e
   ```

   If you are fixing a bug or adding a feature, consider adding new tests or updating existing ones to cover your changes.

6. **Commit your changes**: Once you are satisfied with your changes, commit them using descriptive commit messages. This project follows the conventional commits specification for commit messages.

   ```shell
   git commit -m "<type>(<scope>): <description>"
   ```

   Appropriate types include:

   - `feat`: A new feature
   - `fix`: A bug fix
   - `docs`: Documentation changes
   - `chore`: Maintenance tasks, build changes, etc.

   The scope should indicate the part of the project that is affected by the change.

   - `cli-forge`: Changes to the CLI
   - `parser`: Changes to the documentation generator
   - `docs-site`: Changes to the documentation

7. **Push your changes**: Push your changes to your forked repository.

   ```shell
   git push origin your-branch-name
   ```

8. **Create a pull request**: Finally, create a pull request from your forked repository to our main repository. Provide a clear and concise description of your changes in the pull request.

We will review your contribution as soon as possible and provide feedback if necessary. Thank you for your valuable contribution!

Additional Resources:

- https://opensource.guide/how-to-contribute/
