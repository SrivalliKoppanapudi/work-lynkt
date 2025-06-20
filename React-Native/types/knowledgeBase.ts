// Knowledge Base Types
export interface KnowledgeResource {
  id: string;
  title: string;
  description: string;
  type: 'article' | 'video' | 'research' | 'document';
  url: string;
  categories: string[];
  created_at: string;
  author_id: string;
  author_name?: string;
  views: number;
  favorites: number;
  is_featured: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
}

export interface ResourceUpload {
  title: string;
  description: string;
  type: 'article' | 'video' | 'research' | 'document';
  url: string;
  categories: string[];
  file?: File;
}