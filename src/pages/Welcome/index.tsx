/* eslint-disable no-undef */
import { Drawer, message } from 'antd';
import React, { useEffect, useState } from 'react';
import { Tabs, Row, Col, Tag } from 'antd';
import { FormattedMessage, useModel } from 'umi';
import { filter } from 'lodash';
import { Link, useHistory } from 'react-router-dom';
import CookieConsent, { Cookies } from "react-cookie-consent";
import { ReactSVG } from 'react-svg';
import GeneSearcher from '@/components/GeneSearcher';
import { getDatasetRapexGenes } from '@/services/swagger/RapexDataset';
import { Carousel } from 'react-responsive-carousel';
import MarkdownViewer from '@/components/MarkdownViewer';
import { getDownload as getFile } from '@/services/swagger/Instance';
// import type { ProDescriptionsItemProps } from '@ant-design/pro-descriptions';
// import ProDescriptions from '@ant-design/pro-descriptions';

import "react-responsive-carousel/lib/styles/carousel.min.css";
import './index.less';

type Item = {
  label: any,
  key: string,
  visible: boolean,
  data?: []
}

type ImageItem = {
  src: string,
  title: string
}

type TagItem = {
  route: string,
  title: string | React.ReactElement
}

type StatItem = {
  title: string | React.ReactElement,
  key: string,
  stat: string
}

const Welcome: React.FC = () => {
  const history = useHistory();
  const [showDetail, setShowDetail] = useState<boolean>(false);
  const [organ, setOrgan] = useState<string>("");
  const [organDescUrl, setOrganDescUrl] = useState<string>("");
  const [cookieName, setCookieName] = useState<string>("rapex-cookie-consent-form");
  const [cookieEnabled, setCookieEnabled] = useState<boolean | undefined>(undefined);

  const { defaultDataset } = useModel('dataset', (ret) => ({
    defaultDataset: ret.defaultDataset,
    setDataset: ret.setDataset,
  }));

  useEffect(() => {
    const v = Cookies.get(cookieName);
    setCookieEnabled(v === "true" ? true : false);
    console.log("Cookie Status: ", v, typeof v, cookieEnabled);
    if (v) {
      allowTrack()
    }
  }, []);

  const allowTrack = function () {
    var custom_script = document.createElement('script');
    custom_script.setAttribute('src', '//rf.revolvermaps.com/0/0/5.js?i=506fpu66up3&amp;m=0&amp;c=ff0000&amp;cr1=ffffff');
    custom_script.setAttribute('async', "async");
    var dlAnchorElem = document.getElementsByTagName('body')[0];
    dlAnchorElem.appendChild(custom_script);
  };

  const items: Item[] = [
    {
      label: <FormattedMessage id="pages.Welcome.single-gene-analysis" defaultMessage="Search Gene" />,
      key: "single-gene-analysis",
      visible: true,
    },
    {
      label: <FormattedMessage id="pages.Welcome.multiple-genes-analysis" defaultMessage="Multiple Genes Analysis" />,
      key: "multiple-genes-analysis",
      visible: false,
      data: []
    },
    {
      label: <FormattedMessage id="pages.Welcome.custom-data-analysis" defaultMessage="Custom Data Analysis" />,
      key: "custom-data-analysis",
      visible: false,
      data: []
    },
    {
      label: <FormattedMessage id="pages.Welcome.knowledge-graph" defaultMessage="Knowledge Graph" />,
      key: "knowledge-graph",
      visible: false,
      data: []
    },
    {
      label: <FormattedMessage id="pages.Welcome.datasets" defaultMessage="Datasets" />,
      key: "dataset",
      visible: false,
      data: []
    }
  ]

  const filterItems = filter(items, (item: Item) => {
    return item.visible
  })

  const tags: TagItem[] = [
    {
      title: <FormattedMessage id="pages.Welcome.multiple-genes-analysis" defaultMessage="Multiple Genes" />,
      route: '/expression-analysis/multiple-genes'
    },
    {
      title: <FormattedMessage id="pages.Welcome.kegg-pathways" defaultMessage="KEGG Pathway" />,
      route: '/expression-analysis/kegg-pathways'
    },
    {
      title: <FormattedMessage id="pages.Welcome.diff-genes" defaultMessage="Diff Genes" />,
      route: '/custom-analysis/differential-expression-analysis'
    },
    {
      title: <FormattedMessage id="pages.Welcome.boxplot" defaultMessage="Boxplot" />,
      route: '/custom-analysis/gene-expression-profile?chart=boxplot'
    },
    {
      title: <FormattedMessage id="pages.Welcome.barplot" defaultMessage="Barplot" />,
      route: '/custom-analysis/gene-expression-profile?chart=barplot'
    },
    {
      title: <FormattedMessage id="pages.Welcome.boxplot-organs" defaultMessage="Across Organs on Boxplot" />,
      route: '/custom-analysis/gene-expression-profile?chart=boxplot-organs'
    },
    {
      title: <FormattedMessage id="pages.Welcome.barplot-organs" defaultMessage="Across Organs on Barplot" />,
      route: '/custom-analysis/gene-expression-profile?chart=barplot-organs'
    },
    {
      title: <FormattedMessage id="pages.Welcome.correlation-analysis" defaultMessage="Correlation Analysis" />,
      route: '/custom-analysis/gene-expression-profile?chart=correlation-analysis'
    },
    {
      title: <FormattedMessage id="pages.Welcome.similar-genes-detection" defaultMessage="Similar Genes Detection" />,
      route: '/custom-analysis/similar-genes-detection'
    },
    {
      title: <FormattedMessage id="pages.Welcome.knowledge-graph" defaultMessage="Knowledge Graph" />,
      route: '/knowledge-graph'
    },
    {
      title: <FormattedMessage id="pages.Welcome.datasets" defaultMessage="Datasets" />,
      route: '/datasets'
    },
  ]

  const images: ImageItem[] = [
    {
      src: '/examples/0.png',
      title: 'Multi-omics Data',
    },
    {
      src: '/examples/1.png',
      title: 'Knowledge Graph & Statistics'
    },
    {
      src: '/examples/2.png',
      title: 'Interactive Charts'
    },
    // {
    //   src: '/examples/3.png',
    //   title: 'Single Page Analysis'
    // },
    // {
    //   src: '/examples/4.png',
    //   title: 'Legend 4'
    // },
    // {
    //   src: '/examples/5.png',
    //   title: 'Legend 5'
    // }
  ]

  const stats: StatItem[] = [
    {
      title: <FormattedMessage id="pages.Welcome.datasets" defaultMessage="Datasets" />,
      key: 'datasets',
      stat: '18',
    },
    // {
    //   title: <FormattedMessage id="pages.Welcome.species" defaultMessage="Species" />,
    //   key: 'species',
    //   stat: '2'
    // },
    {
      title: <FormattedMessage id="pages.Welcome.organs" defaultMessage="Organs" />,
      key: 'organs',
      stat: '11'
    },
    {
      title: <FormattedMessage id="pages.Welcome.samples" defaultMessage="Samples" />,
      key: 'samples',
      stat: '2,494'
    },
    {
      title: <FormattedMessage id="pages.Welcome.publications" defaultMessage="Curated Publications" />,
      key: 'publications',
      stat: '1,000'
    }
  ]

  const onSearch = (value: string | string[]) => {
    if (value && typeof value === 'string') {
      history.push(`/expression-analysis/single-gene?ensemblId=${value}`);
    } else {
      message.warn("Unknown error, please contact administrators.")
    }
  }

  const onClickOrgan = (e: any) => {
    const organ = e.target.parentNode.parentNode.id || e.target.parentNode.id;
    console.log("onClickOrgan: ", e, organ);
    if (['lung', 'liver', 'gut', 'thyroid', 'brain', 'testis', 'heart', 'kidney'].indexOf(organ) >= 0) {
      setShowDetail(true);
      setOrgan(organ);
      setOrganDescUrl(`/README/${organ}.md`);
    }
  }

  const description = 'RAPEX is an open-source platform comprising various transcriptome datasets and analyzing tools, as well as a knowledge graph providing a multi-omics network linking vast other factors related to the research questions.'

  return (
    <Row className='welcome'>
      <Col className='logo-container'>
        <img alt="logo" src="/logo.png" className='logo' />
        <span>RAPEX - Response to Air Pollution EXposure</span>
      </Col>
      <Col className='search-container'>
        <Tabs>
          {filterItems.map((item: Item) => {
            return (
              <Tabs.TabPane tab={item.label} key={item.key}>
                {
                  item.key === 'single-gene-analysis' ?
                    <Row className='gene-searcher-box'>
                      <Row className='search-box'>
                        <span className='title'>Enter gene symbol, ensembl id or entrez id</span>
                        <GeneSearcher
                          dataset={defaultDataset}
                          queryGenes={getDatasetRapexGenes}
                          placeholder="e.g Trp53 / ENSMUSG00000059552 / 22059"
                          style={{ width: '100%' }}
                          onChange={onSearch} />
                        <div className='tag-container'>
                          {
                            tags.map(tag => {
                              return (
                                <Link to={tag.route} key={tag.route}>
                                  <Tag color="#108ee9" key={tag.route}>{tag.title}</Tag>
                                </Link>
                              )
                            })
                          }
                        </div>
                      </Row>
                      <Row className='text-statistics'>
                        {
                          stats.map(item => {
                            return (
                              <Col span={6} className='stat-item' key={item.key}>
                                <span>{item.stat}</span>
                                <span className='title'>{item.title}</span>
                              </Col>
                            )
                          })
                        }
                      </Row>
                      <Row className='statistics' gutter={16}>
                        <Col className='data-stat' md={9} sm={24} xs={9} xxl={9}>
                          <ReactSVG src="/mice-organs.svg" onClick={(e) => { onClickOrgan(e) }}></ReactSVG>
                          <FormattedMessage id="pages.Welcome.description" defaultMessage={description} />
                          {/* <p style={{ textAlign: 'justify' }}>{description}</p> */}
                        </Col>
                        <Col className='image-container' md={15} sm={24} xs={15} xxl={15}>
                          <Carousel autoPlay dynamicHeight={true} infiniteLoop>
                            {images.map((item: ImageItem) => {
                              return (
                                <div key={item.title}>
                                  <img src={item.src} />
                                  <p className="legend">{item.title}</p>
                                </div>
                              )
                            })}
                          </Carousel>
                        </Col>
                      </Row>
                    </Row>
                    :
                    null
                }
              </Tabs.TabPane>
            )
          })}
        </Tabs>
      </Col>

      <Drawer
        width={'50%'}
        visible={showDetail}
        className="organ-details"
        onClose={() => {
          setOrgan("")
          setShowDetail(false)
        }}
        closable={true}
        maskClosable={true}
      >
        <MarkdownViewer getFile={getFile} url={organDescUrl} />
      </Drawer>
      <CookieConsent
        location="bottom"
        cookieName={cookieName}
        style={{ background: "#2B373B" }}
        enableDeclineButton
        buttonStyle={{ color: "#4e503b", fontSize: "13px" }}
        expires={150}
        onAccept={() => {
          allowTrack()
        }}
      >
        This website uses an toolbox from revolvermaps.com to count the number of visitors, but we don't gather and track your personal information.
      </CookieConsent>
    </Row >
  );
};

export default Welcome;
