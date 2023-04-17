import GeneListWrapper from './GeneListWrapper';
import KEGGPathwayWrapper from './KEGGPathwayWrapper';
import SimilarGeneListWrapper from './SimilarGeneListWrapper';
import SingleGene from './SingleGene';
import StatEngineWrapper from './StatEngineWrapper';

export default {
  GeneListWrapper,
  KEGGPathwayWrapper,
  SimilarGeneListWrapper,
  SingleGene,
  StatEngineWrapper,
};

export const getItems4OmicsAnalyzer = () => {
  const items = [
    {
      label: "Single Gene",
      key: "single-gene",
      children: <SingleGene ensemblId={null} />
    },
    {
      label: "Gene List",
      key: "gene-list",
      children: <GeneListWrapper />
    },
    {
      label: "KEGG Pathway",
      key: "kegg-pathway",
      children: <KEGGPathwayWrapper />
    },
    {
      label: "Similar Genes",
      key: "similar-genes",
      children: <SimilarGeneListWrapper />
    },
    {
      label: "Statistics Engine",
      key: "statistics-engine",
      children: <StatEngineWrapper />
    }
  ]

  return items
}