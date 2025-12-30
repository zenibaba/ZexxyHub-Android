// Custom Protobuf implementation ported from Python
// This handles manual construction of protobuf packets used by the Garena API

export type ProtoValue = number | string | Uint8Array | ProtoField;
export interface ProtoField {
    [key: number]: ProtoValue;
}

// EnC_Vr (Encode Varint)
function encodeVarint(n: number): Uint8Array {
    if (n < 0) return new Uint8Array(0);
    const bytes: number[] = [];
    while (true) {
        let byte = n & 0x7F;
        n >>>= 7; // Use zero-fill right shift for logical shift
        if (n > 0) {
            byte |= 0x80;
        }
        bytes.push(byte);
        if (n === 0) break;
    }
    return new Uint8Array(bytes);
}

// CrEaTe_VarianT (Varint Field)
// wire type 0
function createVariant(fieldNumber: number, value: number): Uint8Array {
    const fieldHeader = (fieldNumber << 3) | 0;
    const headerBytes = encodeVarint(fieldHeader);
    const valueBytes = encodeVarint(value);
    
    const result = new Uint8Array(headerBytes.length + valueBytes.length);
    result.set(headerBytes);
    result.set(valueBytes, headerBytes.length);
    return result;
}

// CrEaTe_LenGTh (Length Delimited Field)
// wire type 2
function createLength(fieldNumber: number, value: string | Uint8Array): Uint8Array {
    const fieldHeader = (fieldNumber << 3) | 2;
    const headerBytes = encodeVarint(fieldHeader);
    
    let valueBytes: Uint8Array;
    if (typeof value === 'string') {
        valueBytes = new TextEncoder().encode(value);
    } else {
        valueBytes = value;
    }
    
    const lengthBytes = encodeVarint(valueBytes.length);
    
    const result = new Uint8Array(headerBytes.length + lengthBytes.length + valueBytes.length);
    let offset = 0;
    result.set(headerBytes, offset); offset += headerBytes.length;
    result.set(lengthBytes, offset); offset += lengthBytes.length;
    result.set(valueBytes, offset);
    
    return result;
}

// CrEaTe_ProTo
export function createProto(fields: ProtoField): Uint8Array {
    const chunks: Uint8Array[] = [];
    let totalLength = 0;

    // Keys in JS objects are strings, need to parse to int for sorting/iteration if strict order needed?
    // Python dicts preserve insertion order (usually). The script iterates `fields.items()`.
    // In JS `for .. in` or `Object.entries` is usually mostly ordered for integer-like keys but strictly implementation dependent order for others.
    // However, protobuf order shouldn't theoretically matter for deserialization, but let's stick to simple iteration.
    
    // Convert keys to numbers to act like the python dict
    for (const [keyStr, value] of Object.entries(fields)) {
        const fieldNumber = Number(keyStr);
        if (isNaN(fieldNumber)) continue;

        let chunk: Uint8Array | null = null;

        if (typeof value === 'object' && !(value instanceof Uint8Array)) {
            // Nested dict
            const nestedPacket = createProto(value as ProtoField);
            chunk = createLength(fieldNumber, nestedPacket);
        } else if (typeof value === 'number') {
            chunk = createVariant(fieldNumber, value);
        } else if (typeof value === 'string' || value instanceof Uint8Array) {
            chunk = createLength(fieldNumber, value);
        }

        if (chunk) {
            chunks.push(chunk);
            totalLength += chunk.length;
        }
    }

    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
    }
    return result;
}
