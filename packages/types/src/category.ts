/**
 * Product categories — admin can create/delete.
 */

export interface Category {
  _id: string;
  name: string;
  description?: string;
  productCount?: number; // virtual, populated in list API
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryInput {
  name: string;
  description?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
}
