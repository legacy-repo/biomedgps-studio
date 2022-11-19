/* eslint-disable no-undef */
import React from 'react';
import { Tabs, Row, Col, Tag } from 'antd';
import { FormattedMessage } from 'umi';
import { filter } from 'lodash';
import { Link } from 'react-router-dom'
import GeneSearcher from '@/components/GeneSearcher';
import { getGenes } from '@/services/swagger/OmicsData';
import { Carousel } from 'react-responsive-carousel';

import "react-responsive-carousel/lib/styles/carousel.min.css";
import './welcome.less';

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

const Welcome: React.FC = () => {
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
      title: 'Legend 0',
    },
    {
      src: '/examples/1.png',
      title: 'Legend 1'
    },
    {
      src: '/examples/2.png',
      title: 'Legend 2'
    },
    {
      src: '/examples/3.png',
      title: 'Legend 3'
    },
    {
      src: '/examples/4.png',
      title: 'Legend 4'
    },
    {
      src: '/examples/5.png',
      title: 'Legend 5'
    }
  ]

  const onSearch = (value: string) => {

  }

  const description = 'A glioma is a type of tumor that starts in the glial cells of the brain or the spine. Gliomas comprise about 30 percent of all brain tumors and central nervous system tumors, and 80 percent of all malignant brain tumors. - Wikipedia'

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
                      <Col className='search-box'>
                        <span className='title'>Enter gene symbol, ensembl id or entrez id</span>
                        <GeneSearcher queryGenes={getGenes} placeholder="e.g Trp53 / ENSMUSG00000059552 / 22059" style={{ width: '100%' }} onChange={onSearch} />
                        <div className='tag-container'>
                          {
                            tags.map(tag => {
                              return (
                                <Link to={tag.route}>
                                  <Tag color="#108ee9" key={tag.route}>{tag.title}</Tag>
                                </Link>
                              )
                            })
                          }
                        </div>
                      </Col>
                      <Row className='statistics' gutter={16}>
                        <Col className='data-stat' md={9} sm={24} xs={9} xxl={9}>
                          <img src="/data-stat.png"></img>
                          <FormattedMessage id="pages.Welcome.description" defaultMessage={description} />
                        </Col>
                        <Col className='image-container' md={15} sm={24} xs={15} xxl={15}>
                          <Carousel autoPlay dynamicHeight={false}>
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
    </Row >
  );

};

export default Welcome;
