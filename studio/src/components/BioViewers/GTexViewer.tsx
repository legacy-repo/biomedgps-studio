import React, { useEffect, useState } from 'react'
import {
  GTexTranscriptViewer, GTexGeneBoxplotViewer,
  GTexGeneViolinViewer
} from 'biominer-components';

type GTexViewerProps = {
  rootId?: string,
  type: string, // gene or transcript
  title?: string,
  officialGeneSymbol: string // e.g. 'PRG4', only support human gene for now
}

const GTexViewer: React.FC<GTexViewerProps> = (props) => {
  const [rootId, setRootId] = useState<string>("");

  useEffect(() => {
    if (!props.rootId) {
      setRootId('gtex-viewer')
    } else {
      setRootId(props.rootId)
    }
  }, []);

  return (
    <div>
      {
        props.type == 'transcript' ?
          <div>
            <GTexTranscriptViewer
              rootId={rootId + '-isoform-transposed'}
              type="isoformTransposed" title={props.title}
              geneId={props.officialGeneSymbol} />
            <GTexTranscriptViewer
              rootId={rootId + '-exon'}
              type="exon" geneId={props.officialGeneSymbol} />
            <GTexTranscriptViewer
              rootId={rootId + '-junction'}
              type="junction" geneId={props.officialGeneSymbol} />
          </div>
          : null
      }
      {
        props.type == 'gene' ?
          <div>
            <GTexGeneBoxplotViewer rootId={rootId + 'boxplot'}
              title={props.title || 'GTEx Gene Boxplot Viewer'}
              geneId={props.officialGeneSymbol} />
            <GTexGeneViolinViewer rootId={rootId + 'violin'}
              title={props.title || 'GTEx Gene Violin Viewer'}
              geneId={props.officialGeneSymbol} />
          </div>
          : null
      }
    </div>
  )
}

export default GTexViewer;