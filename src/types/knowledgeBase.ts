export interface KnowledgeBaseSummary {
  id: string;
  name: string;
  description: string;
  document_count: number;
}

export interface ExtraInfo {
  type: string;
  size: number;
  created_at: string;
  updated_at: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  description: string;
  markdown_url: string;
  extra_info: ExtraInfo;
}

export interface KnowledgeBaseDetail extends KnowledgeBaseSummary {
  documents: DocumentItem[];
}

export interface GraphNode {
  id: string;
  name: string;
  tags: string[];
}

export interface KnowledgeGraph {
  documents: GraphNode[];
} 