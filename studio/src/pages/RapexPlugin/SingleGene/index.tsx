import { Row, Col, Tag, message, Space } from 'antd';
import React, { useEffect, useState } from 'react';
import GeneSearcher from '@/components/GeneSearcher';
import SimilarGeneList from '@/components/SimilarGeneList';
import { getDatasetRapexGenes, getDatasetRapexSimilarGenes } from '@/services/swagger/RapexDataset';
import type { GeneData } from '@/components/GeneSearcher';
import PlotlyViewer from '@/components/PlotlyViewer/indexClass';
import type { PlotlyChart } from '@/components/PlotlyViewer/data';
import { useLocation } from "react-router-dom";
import HelpMessage from '@/components/HelpMessage';
import { getDownload as getFile } from '@/services/swagger/File';
import { useModel } from 'umi';

import './index.less';

const SingleGene: React.FC<{ ensemblId: string | null }> = (props) => {
  const search = useLocation().search;
  const id = new URLSearchParams(search).get('ensemblId') || props.ensemblId || "ENSMUSG00000059552";
  const [ensemblId, setEnsemblId] = useState<string>(id);
  const [gene, setGene] = useState<GeneData | undefined>(undefined);
  const [barPlot, setBarPlot] = useState<PlotlyChart | null>(null);
  const [boxPlot, setBoxPlot] = useState<PlotlyChart | null>(null);

  const { defaultDataset } = useModel('dataset', (ret) => ({
    defaultDataset: ret.defaultDataset,
    setDataset: ret.setDataset,
  }));

  useEffect(() => {
    if (ensemblId && ensemblId !== "NA") {
      const query_str = `{:select [:*] :where [:like [:upper :ensembl_id] [:upper "%${ensemblId}%"]]}`
      getDatasetRapexGenes({
        // rapex_degs.duckdb has a data table.
        query_str: query_str,
        dataset: defaultDataset
      })
        .then((response) => {
          const { data } = response;
          setGene(data && data[0])
        })
        .catch((error) => {
          console.log('requestDEGs Error: ', error);
          setGene(undefined)
        });

      getFile({ filelink: `file:///${defaultDataset}/single_gene/barplot_across_organs/${ensemblId}.json` }).then((response: any) => {
        setBarPlot({
          data: response.data,
          layout: response.layout,
          frames: response.frames || undefined
        });
      }).catch(error => {
        message.warn("Cannot fetch the result, please retry later.")
      });

      getFile({ filelink: `file:///${defaultDataset}/single_gene/boxplot_across_organs/${ensemblId}.json` }).then((response: any) => {
        setBoxPlot({
          data: response.data,
          layout: response.layout,
          frames: response.frames || undefined
        });
      }).catch(error => {
        message.warn("Cannot fetch the result, please retry later.")
      });
    } else {
      setGene(undefined);
      setBarPlot(null);
      setBoxPlot(null);
      // message.warn(`No such gene ${ensemblId}, use the default gene instead of it.`, 5);
    }
  }, [ensemblId])

  const onSearch = (value: string | string[], gene: GeneData | undefined) => {
    console.log("onSearch: ", value, gene)
    if (value && typeof value === 'string') {
      setEnsemblId(value)
    }

    if (gene) {
      setGene(gene)
    }
  }

  return (
    <Space className='single-gene-container'>
      <HelpMessage position='center'
        title={"General Information for Single Gene"}>
        <p>
          You can search for genes of interest on this page. After a quick search, you can see the trend of the expression level of this gene in different organs between the exposed group and the control group. And you also can view the top 100 genes that most closely resemble your gene expression patterns and related description information.
          <br />
          <br />
          <b>Quick Search</b>: You can input gene_symbol, ensembl_id or entrez_id to analyze. (e.g. Trp53/22059/ENSMUSG00000059552)
        </p>
      </HelpMessage>
      <Row className='single-gene'>
        <Col className='left' xxl={10} xl={10} lg={10} md={24} sm={24} xs={24}>
          <Row className='gene-searcher'>
            <Col className='header' span={24}>
              <span style={{ fontWeight: 500 }}>Quick Search</span>
              <GeneSearcher
                dataset={defaultDataset}
                queryGenes={getDatasetRapexGenes}
                placeholder="e.g Trp53 / ENSMUSG00000059552 / 22059"
                style={{ width: '100%' }} initialValue={ensemblId}
                onChange={onSearch} />
            </Col>
            <Col className='summary' span={24}>
              <h3>{gene ? gene.gene_symbol : ""}</h3>
              <p>
                <Tag>Entrez ID</Tag>
                <a href={`https://www.ncbi.nlm.nih.gov/gene/?term=${gene && gene.entrez_id}`} target="_blank">
                  {gene ? gene.entrez_id : ""}
                </a>
              </p>
              <p>
                <Tag>Ensembl ID</Tag>
                <a href={`https://www.ensembl.org/Mus_musculus/Gene/Summary?db=core;g=${gene && gene.ensembl_id}`} target="_blank">
                  {gene ? gene.ensembl_id : ""}
                </a>
              </p>
              <p><Tag>Alias</Tag>{gene ? gene.alias.replaceAll(",", ", ") : ""}</p>
              <p><Tag>Name</Tag>{gene ? gene.name : ""}</p>
              <p><Tag>Description</Tag>{gene ? gene.description : ""}</p>
              <p><Tag>Type</Tag>{gene ? gene.type_of_gene : ""}</p>
              <p><Tag>MGI</Tag>{gene ? gene.mgi_id : ""}</p>
              <p><Tag>Taxid</Tag>{gene ? gene.taxid : ""}</p>
              <p>
                <Tag>Chromosome</Tag>{gene ? gene.chromosome : ""} &nbsp;
                <Tag>Strand</Tag>{gene ? gene.strand : ""} &nbsp;
                <Tag>Start</Tag>{gene ? gene.start : ""} &nbsp;
                <Tag>End</Tag>{gene ? gene.end : ""} &nbsp;
              </p>
              <p>
                <Tag>Pubmed</Tag>
                <a href={`https://pubmed.ncbi.nlm.nih.gov/${gene ? gene.pubmed_ids : ""}`} target="_blank">
                  {(gene && gene.pubmed_ids.length < 5) ? gene.pubmed_ids : `${gene ? gene.pubmed_ids.length : 0} Publications`}
                </a>
              </p>
              {(gene && gene.pdb) ?
                (
                  <p>
                    <Tag>PDB</Tag>
                    {
                      gene.pdb.split(',').map(item => {
                        return (
                          <a href={`https://www.rcsb.org/structure/${item}`}
                            target="_blank"
                            key={item}
                            style={{ marginRight: '10px' }}>
                            {item}
                          </a>
                        )
                      })
                    }
                  </p>

                )
                :
                null
              }
              {(gene && gene.pfam) ?
                (
                  <p>
                    <Tag>Pfam</Tag>
                    {
                      gene.pfam.split(',').map(item => {
                        return (
                          <a href={`https://www.ebi.ac.uk/interpro/search/text/${item}`}
                            target="_blank"
                            key={item}
                            style={{ marginRight: '10px' }}>
                            {item}
                          </a>
                        )
                      })
                    }
                  </p>

                )
                :
                null
              }
              {(gene && gene.prosite) ?
                (
                  <p>
                    <Tag>Prosite</Tag>
                    {
                      gene.prosite.split(',').map(item => {
                        return (
                          <a href={`https://prosite.expasy.org/cgi-bin/prosite/prosite_search_full.pl?SEARCH=${item}`}
                            target="_blank"
                            key={item}
                            style={{ marginRight: '10px' }}>
                            {item}
                          </a>
                        )
                      })
                    }
                  </p>

                )
                :
                null
              }
            </Col>
          </Row>
        </Col>
        <Col className='right' xxl={14} xl={14} lg={14} md={24} sm={24} xs={24}>
          <Row className='statistics'>
            <PlotlyViewer responsiveKey={1} plotlyData={barPlot} key="1" mode="Plotly"></PlotlyViewer>
            <PlotlyViewer responsiveKey={2} plotlyData={boxPlot} key="2" mode="Plotly"></PlotlyViewer>
            <Row>
              <h3>
                Most Similar Genes
              </h3>
              <p>The similar detection are based on the datasets used above.</p>
              <SimilarGeneList
                defaultDataset={defaultDataset}
                ensemblId={ensemblId}
                querySimilarGenes={getDatasetRapexSimilarGenes}
                queryGenes={getDatasetRapexGenes}>
              </SimilarGeneList>
            </Row>
          </Row>
        </Col>
      </Row>
    </Space>
  )
};

export default SingleGene;
