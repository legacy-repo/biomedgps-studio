export type GeneInfo = {
  _id: string;
  _version: number;
  entrezgene: number;
  hgnc: number;
  name: string;
  symbol: string;
  taxid: number;
  summary: string;
  type_of_gene: string;
  ensembl: {
    gene: string;
    transcript: string[];
    protein: string[];
    translation: string[];
  };
  genomic_pos: {
    chr: string;
    start: number;
    end: number;
    strand: number;
  };
}

export type GetItems4GenePanelFn = (info: GeneInfo, exclude: any[]) => any[];

export type GetGeneInfoFn = (geneId: string) => Promise<GeneInfo>;