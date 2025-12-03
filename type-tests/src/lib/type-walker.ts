import * as ts from 'typescript';

/**
 * A node in the type tree representing a TypeScript type
 */
export interface TypeNode {
  /** The kind of type (e.g., 'string', 'object', 'union', 'reference') */
  kind: string;

  /** Human-readable name of the type */
  name: string;

  /** Full type string representation */
  typeString: string;

  /** For object types, the properties of the object */
  properties?: PropertyInfo[];

  /** For generic types, the type arguments */
  typeArguments?: TypeNode[];

  /** Child types (for unions, intersections, etc.) */
  children?: TypeNode[];

  /** Additional metadata about the type */
  metadata?: {
    /** Whether this is an optional property */
    isOptional?: boolean;

    /** Whether this is a readonly property */
    isReadonly?: boolean;

    /** Whether this type has an index signature */
    hasIndexSignature?: boolean;

    /** Index signature info if present */
    indexSignature?: {
      keyType: string;
      valueType: string;
    };
  };
}

/**
 * Information about an object property
 */
export interface PropertyInfo {
  name: string;
  type: TypeNode;
  isOptional: boolean;
  isReadonly: boolean;
}

const MAX_DEFAULT_DEPTH = 10;

/**
 * Walk a TypeScript type recursively and build a tree representation
 *
 * @param type - The TypeScript type to walk
 * @param typeChecker - TypeScript type checker
 * @param depth - Maximum recursion depth (default: 10)
 * @param currentDepth - Current recursion depth (internal use)
 * @returns A tree representation of the type
 */
export function walkType(
  type: ts.Type,
  typeChecker: ts.TypeChecker,
  depth: number = MAX_DEFAULT_DEPTH,
  currentDepth = 0
): TypeNode {
  if (currentDepth >= depth) {
    return {
      kind: 'max-depth',
      name: '...',
      typeString: typeChecker.typeToString(type),
    };
  }

  const typeString = typeChecker.typeToString(
    type,
    undefined,
    ts.TypeFormatFlags.NoTruncation
  );

  // Handle primitive types
  if (type.flags & ts.TypeFlags.String) {
    return { kind: 'string', name: 'string', typeString };
  }
  if (type.flags & ts.TypeFlags.Number) {
    return { kind: 'number', name: 'number', typeString };
  }
  if (type.flags & ts.TypeFlags.Boolean) {
    return { kind: 'boolean', name: 'boolean', typeString };
  }
  if (type.flags & ts.TypeFlags.Void) {
    return { kind: 'void', name: 'void', typeString };
  }
  if (type.flags & ts.TypeFlags.Undefined) {
    return { kind: 'undefined', name: 'undefined', typeString };
  }
  if (type.flags & ts.TypeFlags.Null) {
    return { kind: 'null', name: 'null', typeString };
  }
  if (type.flags & ts.TypeFlags.Any) {
    return { kind: 'any', name: 'any', typeString };
  }
  if (type.flags & ts.TypeFlags.Unknown) {
    return { kind: 'unknown', name: 'unknown', typeString };
  }
  if (type.flags & ts.TypeFlags.Never) {
    return { kind: 'never', name: 'never', typeString };
  }

  // Handle string/number/boolean literal types
  if (type.flags & ts.TypeFlags.StringLiteral) {
    const literal = (type as ts.StringLiteralType).value;
    return {
      kind: 'string-literal',
      name: `"${literal}"`,
      typeString,
    };
  }
  if (type.flags & ts.TypeFlags.NumberLiteral) {
    const literal = (type as ts.NumberLiteralType).value;
    return {
      kind: 'number-literal',
      name: literal.toString(),
      typeString,
    };
  }
  if (type.flags & ts.TypeFlags.BooleanLiteral) {
    const literal = (type as any).intrinsicName === 'true';
    return {
      kind: 'boolean-literal',
      name: literal.toString(),
      typeString,
    };
  }

  // Handle union types
  if (type.flags & ts.TypeFlags.Union) {
    const unionType = type as ts.UnionType;
    return {
      kind: 'union',
      name: 'union',
      typeString,
      children: unionType.types.map((t) =>
        walkType(t, typeChecker, depth, currentDepth + 1)
      ),
    };
  }

  // Handle intersection types
  if (type.flags & ts.TypeFlags.Intersection) {
    const intersectionType = type as ts.IntersectionType;
    return {
      kind: 'intersection',
      name: 'intersection',
      typeString,
      children: intersectionType.types.map((t) =>
        walkType(t, typeChecker, depth, currentDepth + 1)
      ),
    };
  }

  // Handle object types (including interfaces, classes, type literals)
  if (type.flags & ts.TypeFlags.Object) {
    const objectType = type as ts.ObjectType;

    // Check for type reference (generic instantiation)
    if (objectType.objectFlags & ts.ObjectFlags.Reference) {
      const typeRef = objectType as ts.TypeReference;
      const typeArgs = typeChecker.getTypeArguments(typeRef);

      const symbol = type.getSymbol() || type.aliasSymbol;
      const name = symbol ? symbol.getName() : 'AnonymousType';

      return {
        kind: 'reference',
        name,
        typeString,
        typeArguments:
          typeArgs.length > 0
            ? typeArgs.map((t) => walkType(t, typeChecker, depth, currentDepth + 1))
            : undefined,
        properties: getObjectProperties(type, typeChecker, depth, currentDepth),
        metadata: getObjectMetadata(type, typeChecker),
      };
    }

    // Handle plain object types
    const symbol = type.getSymbol() || type.aliasSymbol;
    const name = symbol ? symbol.getName() : 'Object';

    return {
      kind: 'object',
      name,
      typeString,
      properties: getObjectProperties(type, typeChecker, depth, currentDepth),
      metadata: getObjectMetadata(type, typeChecker),
    };
  }

  // Handle type parameters
  if (type.flags & ts.TypeFlags.TypeParameter) {
    const symbol = type.getSymbol();
    const name = symbol ? symbol.getName() : 'T';
    return {
      kind: 'type-parameter',
      name,
      typeString,
    };
  }

  // Handle conditional types
  if (type.flags & ts.TypeFlags.Conditional) {
    return {
      kind: 'conditional',
      name: 'conditional',
      typeString,
    };
  }

  // Handle index types
  if (type.flags & ts.TypeFlags.Index) {
    return {
      kind: 'index',
      name: 'keyof',
      typeString,
    };
  }

  // Fallback for unknown types
  return {
    kind: 'unknown-type',
    name: typeString,
    typeString,
  };
}

/**
 * Extract properties from an object type
 */
function getObjectProperties(
  type: ts.Type,
  typeChecker: ts.TypeChecker,
  maxDepth: number,
  currentDepth: number
): PropertyInfo[] {
  const properties: PropertyInfo[] = [];
  const propsSymbols = typeChecker.getPropertiesOfType(type);

  for (const propSymbol of propsSymbols) {
    const propType = typeChecker.getTypeOfSymbolAtLocation(
      propSymbol,
      propSymbol.valueDeclaration!
    );

    const isOptional = !!(propSymbol.flags & ts.SymbolFlags.Optional);
    const isReadonly = !!propSymbol
      .getDeclarations()
      ?.some((d) => {
        if (ts.isPropertySignature(d) || ts.isPropertyDeclaration(d)) {
          return d.modifiers?.some(
            (m) => m.kind === ts.SyntaxKind.ReadonlyKeyword
          );
        }
        return false;
      });

    properties.push({
      name: propSymbol.getName(),
      type: walkType(propType, typeChecker, maxDepth, currentDepth + 1),
      isOptional,
      isReadonly,
    });
  }

  return properties;
}

/**
 * Extract metadata about an object type (index signatures, etc.)
 */
function getObjectMetadata(
  type: ts.Type,
  typeChecker: ts.TypeChecker
): TypeNode['metadata'] {
  const metadata: TypeNode['metadata'] = {};

  // Check for index signatures
  const stringIndexType = typeChecker.getIndexTypeOfType(
    type,
    ts.IndexKind.String
  );
  const numberIndexType = typeChecker.getIndexTypeOfType(
    type,
    ts.IndexKind.Number
  );

  if (stringIndexType) {
    metadata.hasIndexSignature = true;
    metadata.indexSignature = {
      keyType: 'string',
      valueType: typeChecker.typeToString(stringIndexType),
    };
  } else if (numberIndexType) {
    metadata.hasIndexSignature = true;
    metadata.indexSignature = {
      keyType: 'number',
      valueType: typeChecker.typeToString(numberIndexType),
    };
  }

  return Object.keys(metadata).length > 0 ? metadata : undefined;
}
