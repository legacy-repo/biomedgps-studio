export const genLayout = (title: string, xTitle: string, yTitle: string, autoMargin: boolean) => {
  return {
    title: {
      text: title,
      font: {
        family: 'Arial',
        size: '1.3rem',
        color: '#333333'
      },
      xref: 'paper',
      x: 0,
    },
    xaxis: {
      zeroline: true,
      zerolinecolor: '#333333',
      zerolinewidth: 1,
      tickangle: 315,
      title: {
        text: xTitle,
        font: {
          family: 'Arial',
          size: '1.1rem',
          color: '#333333'
        },
      },
      tickfont: {
        family: 'Arial',
        size: '1rem',
        color: '#333333'
      },
      showgrid: false,
      margin: {
        l: 50,
        r: 50,
        b: 50,
        t: 50,
        pad: 4
      },
      automargin: autoMargin
    },
    yaxis: {
      title: {
        text: yTitle,
        font: {
          family: 'Arial',
          size: '1.1rem',
          color: '#333333'
        },
      },
      tickfont: {
        family: 'Arial',
        size: '1rem',
        color: '#333333'
      },
      showgrid: false,
      zeroline: true,
      zerolinecolor: '#333333',
      zerolinewidth: 1,
      margin: {
        l: 50,
        r: 50,
        b: 50,
        t: 50,
        pad: 4
      },
      automargin: autoMargin
    },
    plot_bgcolor: '#ffffff',
    paper_bgcolor: '#ffffff',
  }
}