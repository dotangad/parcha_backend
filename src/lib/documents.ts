export type TDocumentQuery = {
  limit?: number;
  skip?: number;
  orderBy?: string;
  order?: "asc" | "desc";
  from?: Date;
  to?: Date;
  extensionId?: string[];
};
