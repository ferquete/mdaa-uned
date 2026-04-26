# DSL Modification Protocol

If a grammar in `_CODIGO/dsl/` changes (validation, structure, etc.), you MUST:
1. **Sync Docs**: Update technical reference markdown manuals of `_CODIGO/dsl/`, these manuals are in folder `_CODIGO/dsl/REGLAS_DSLs`.
2. **Sync Validation**: Update Langium validator, JSON schema, and all examples for this grammar. Then, execute `npm run generate:langium` to generate the new validator, and verify that the validator is working correctly, executing validate.ts script with a valid and invalid example.
3. **Sync Frontend**: Update UI schemas, limits, field names, and JSON editor validation for json editor. Update graphical editor as well, revise the params editors and node metadata.
