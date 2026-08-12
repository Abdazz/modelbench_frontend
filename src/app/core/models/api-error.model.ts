export interface ApiFieldError {
  champ: string;
  message: string;
}

export interface ApiError {
  timestamp: string;
  status: number;
  code: string;
  message: string;
  path: string;
  errors: ApiFieldError[] | null;
}
