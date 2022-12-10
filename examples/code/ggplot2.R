library(ggplot2)
library(plotly)
library(jsonlite)

plotly_json <- function(p, ...) {
  plotly:::to_JSON(plotly_build(p), ...)
}

draw_boxplot <- function(outputfile) {
        data(iris)
        plot <- ggplot(data = iris, aes(x = Sepal.Length, y = Sepal.Width)) +
                geom_point(aes(shape = Species, color = Species))
        outplot <- plotly_json(plot, pretty = TRUE)
        write(outplot, file = outputfile)
}