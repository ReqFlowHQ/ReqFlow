import "axios";

declare module "axios" {
  export interface InternalAxiosRequestConfig<D = any> {
    _retry?: boolean;
  }
}
