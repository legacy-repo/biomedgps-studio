import React, { Component } from 'react'
import { TranscriptBrowserComponent } from 'react-gtex-viz'

class GTexTranscriptViewer extends Component {
  render() {
    return (
      <TranscriptBrowserComponent rootId='transcriptBrowser' type='isoformTransposed' geneId='PRG4' />
    )
  }
}

export default GTexTranscriptViewer;