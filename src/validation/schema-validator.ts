import fs from 'node:fs';
import path from 'node:path';
import Ajv, { type ErrorObject, type ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import { isRecord } from './guards';

export interface SchemaResult {
  valid: boolean;
  errors: string;
}

const SCHEMAS_DIR = path.resolve(process.cwd(), 'schemas');
const SCHEMA_PREFIX = 'https://schemas.local/';

class SchemaValidator {
  private readonly ajv: Ajv;

  constructor() {
    this.ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(this.ajv);
    this.registerSchemas();
  }

  validate(schemaFile: string, data: unknown): SchemaResult {
    const validate = this.validator(schemaFile);
    const valid = Boolean(validate(data));
    return {
      valid,
      errors: valid ? '' : formatErrors(validate.errors),
    };
  }

  private validator(schemaFile: string): ValidateFunction {
    const id = `${SCHEMA_PREFIX}${schemaFile}`;
    const validate = this.ajv.getSchema(id);
    if (!validate) {
      throw new Error(`No schema registered for ${schemaFile}`);
    }
    return validate;
  }

  private registerSchemas(): void {
    const files = fs.readdirSync(SCHEMAS_DIR, { recursive: true, encoding: 'utf8' });
    for (const entry of files) {
      if (!entry.endsWith('.json')) continue;
      const absolute = path.join(SCHEMAS_DIR, entry);
      const relative = entry.split(path.sep).join('/');
      const schema: unknown = JSON.parse(fs.readFileSync(absolute, 'utf8'));
      if (!isRecord(schema) || typeof schema.$id !== 'string') {
        throw new Error(`Schema ${relative} must declare a string $id.`);
      }
      const expectedId = `${SCHEMA_PREFIX}${relative}`;
      if (schema.$id !== expectedId) {
        throw new Error(`Schema ${relative} must declare $id ${expectedId}.`);
      }
      this.ajv.addSchema(schema);
    }
  }
}

function formatErrors(errors: ErrorObject[] | null | undefined): string {
  if (!errors || errors.length === 0) return 'unknown schema error';
  return errors
    .map((error) => `${error.instancePath || '/'} ${error.message ?? 'is invalid'}`.trim())
    .join('\n');
}

export const schemaValidator = new SchemaValidator();
