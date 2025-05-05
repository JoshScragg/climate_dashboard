// frontend/src/types/topojson.d.ts
declare namespace topojson {
  export function feature(
    topology: any,
    object: any
  ): GeoJSON.FeatureCollection<GeoJSON.GeometryObject>;

  export function mesh(topology: any, object: any, filter?: Function): GeoJSON.GeometryObject;

  export function neighbors(objects: Array<any>): Array<Array<number>>;

  export function presimplify(
    topology: any,
    triangleArea?: (triangle: Array<any>) => number
  ): any;

  export function quantize(topology: any, transform: any): any;

  export function simplify(topology: any, minWeight?: number): any;

  export function topology(objects: any, quantization?: number): any;
}

declare module 'topojson' {
  export = topojson;
}

declare global {
  interface Window {
    topojson: typeof topojson;
  }
}