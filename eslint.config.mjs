import typescriptEslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import stylistic from '@stylistic/eslint-plugin'

export default [{
    files: ['**/*.ts'],
}, {
    plugins: {
        '@typescript-eslint': typescriptEslint,
        '@stylistic': stylistic
    },

    languageOptions: {
        parser: tsParser,
        ecmaVersion: 2022,
        sourceType: 'module',
    },

    rules: {
        '@typescript-eslint/naming-convention': ['warn', {
            selector: 'import',
            format: ['camelCase', 'PascalCase'],
        }],

        '@stylistic/semi': ['warn', 'never'],
        '@stylistic/quotes': ['warn', 'single'],
        '@stylistic/max-len': ['warn', {code: 80}],


        curly: 'warn',
        eqeqeq: 'warn',
        'no-throw-literal': 'warn',
    },
}]
