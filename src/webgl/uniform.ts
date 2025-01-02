import { Program } from "./program";

type DataType = "FLOAT32" | "INT32" | "UNSUPPORTED";

function throwUniformNotFoundException(name: string): never {
  throw new Error(`Uniform ${name} is not found`);
}

function throwInvalidNumberOfItemsException(nitems: number): never {
  throw new Error(
    `Invalid number of items to register as a uniform: ${nitems.toString()}`,
  );
}

function throwUnsupportedDataTypeException(dataType: string): never {
  throw new Error(`Unsupported data type: ${dataType}`);
}

export class Uniform {
  private _nitems: number;
  private _converter: (data: number[]) => Float32Array | Int32Array;
  private _setter: (typedData: Float32Array | Int32Array) => void;

  public constructor({
    gl,
    program,
    dataType,
    name,
    nitems,
  }: {
    gl: WebGL2RenderingContext;
    program: Program;
    dataType: DataType;
    name: string;
    nitems: number;
  }) {
    const uniformLocation: WebGLUniformLocation | null = program.use({
      gl,
      callback: (webGLProgram: WebGLProgram) =>
        gl.getUniformLocation(webGLProgram, name),
    });
    if (uniformLocation === null) {
      throwUniformNotFoundException(name);
    }
    const converter = (function () {
      if (dataType === "FLOAT32") {
        return (data: number[]) => new Float32Array(data);
      } else if (dataType === "INT32") {
        return (data: number[]) => new Int32Array(data);
      } else {
        throwUnsupportedDataTypeException(dataType);
      }
    })();
    const setter = (function () {
      if (dataType === "FLOAT32") {
        if (nitems === 1) {
          return (typedData: Float32Array | Int32Array) => {
            gl.uniform1fv(uniformLocation, typedData);
          };
        } else if (nitems === 2) {
          return (typedData: Float32Array | Int32Array) => {
            gl.uniform2fv(uniformLocation, typedData);
          };
        } else if (nitems === 3) {
          return (typedData: Float32Array | Int32Array) => {
            gl.uniform3fv(uniformLocation, typedData);
          };
        } else if (nitems === 4) {
          return (typedData: Float32Array | Int32Array) => {
            gl.uniform4fv(uniformLocation, typedData);
          };
        } else {
          throwInvalidNumberOfItemsException(nitems);
        }
      } else {
        if (nitems === 1) {
          return (typedData: Float32Array | Int32Array) => {
            gl.uniform1iv(uniformLocation, typedData);
          };
        } else if (nitems === 2) {
          return (typedData: Float32Array | Int32Array) => {
            gl.uniform2iv(uniformLocation, typedData);
          };
        } else if (nitems === 3) {
          return (typedData: Float32Array | Int32Array) => {
            gl.uniform3iv(uniformLocation, typedData);
          };
        } else if (nitems === 4) {
          return (typedData: Float32Array | Int32Array) => {
            gl.uniform4iv(uniformLocation, typedData);
          };
        } else {
          throwInvalidNumberOfItemsException(nitems);
        }
      }
    })();
    this._nitems = nitems;
    this._converter = converter;
    this._setter = setter;
  }

  public set({ data }: { data: number[] }) {
    // NOTE: assuming the program is used when invoking this method
    const nitems: number = this._nitems;
    const converter = this._converter;
    const setter = this._setter;
    if (nitems !== data.length) {
      throw new Error(
        `Data size mismatch, expected: ${nitems.toString()}, obtained: ${data.length.toString()}`,
      );
    }
    setter(converter(data));
  }
}

export function defineAndSetUniform({
  gl,
  program,
  dataType,
  name,
  data,
}: {
  gl: WebGL2RenderingContext;
  program: Program;
  dataType: DataType;
  name: string;
  data: number[];
}) {
  const nitems = data.length;
  const uniform = new Uniform({
    gl,
    program,
    dataType,
    name,
    nitems,
  });
  program.use({
    gl,
    callback: () => {
      uniform.set({
        data,
      });
    },
  });
}
