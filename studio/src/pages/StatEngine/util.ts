const Handlebars = require('handlebars/dist/handlebars');

export const leftSeperator: string = '"#{{';
export const leftReSeperator: RegExp = new RegExp('"#{{', 'g');
export const rightSeperator: string = '}}#"';
export const rightReSeperator: RegExp = new RegExp('}}#"', 'g');

export interface TemplateParams {
  columns: string[];
  datafile: string[];
}

Handlebars.registerHelper('tojson', function (obj) {
  return JSON.stringify(obj, null, 3);
});

Handlebars.registerHelper('toselect', function (array: string[]) {
  const obj = {};
  array.forEach((item: string) => {
    obj[item] = {
      text: item,
    };
  });
  return JSON.stringify(obj, null, 3);
});

export function render(template: string, params: TemplateParams) {
  let newParams = params;
  if (params.columns.length === 0) {
    newParams = {
      columns: ['Please select data file firstly.'],
      datafile: ['Please select data file firstly.'],
    };
  }

  const formatedTemplate = template
    .replaceAll(leftReSeperator, '{{')
    .replaceAll(rightReSeperator, '}}');

  const compiledTemplate = Handlebars.compile(formatedTemplate);
  // console.log('Template: ', template, newParams, formatedTemplate);
  return JSON.parse(compiledTemplate(newParams));
}
