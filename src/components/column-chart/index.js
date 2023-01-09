import fetchJson from "../../utils/fetch-json.js";

const BACKEND_URL = "https://course-js.javascript.ru";

export default class ColumnChart {
  element;
  chartHeight = 50;

  constructor({
    label = "",
    link = "",
    range = {
      from: new Date(),
      to: new Date(),
    },
    formatHeading = (data) => data,
    url = "",
  } = {}) {
    this.range = range;
    this.label = label;
    this.link = link;
    this.formatHeading = formatHeading;

    this.url = new URL(url, BACKEND_URL);
    this.render();
    this.update(this.range.from, this.range.to);
  }

  async downloadData(from, to) {
    this.url.searchParams.set("from", from);
    this.url.searchParams.set("to", to);
    return await fetchJson(this.url);
  }

  render() {
    const element = document.createElement("div");

    element.innerHTML = this.getTemplate();

    this.element = element.firstElementChild;

    this.subElements = this.getSubElements(this.element);
  }

  getSubElements(element) {
    const elements = element.querySelectorAll("[data-element]");

    return [...elements].reduce((sum, subElement) => {
      sum[subElement.dataset.element] = subElement;

      return sum;
    }, {});
  }

  getTemplate() {
    return `
	  <div class="column-chart_loading">
	  <div class="column-chart" style="--chart-height: ${this.chartHeight}">
		${this.showTitle()}
		<div class="column-chart__container">
		  ${this.showHeader()}
		  <div data-element="body" class="column-chart__chart">
		  </div>
		</div>
	  </div>
	</div>
	  `;
  }

  showLink() {
    return this.link
      ? `<a href=${this.link} class="column-chart__link">View all</a>`
      : "";
  }

  showTitle() {
    return `
	  <div class="column-chart__title">
		  Total ${this.label}
		  ${this.showLink()}
		</div>
	  `;
  }

  showHeader() {
    return `
	  <div data-element="header" class="column-chart__header">${this.formatHeading}</div>
	  `;
  }

  getColumnProps(data) {
    const maxValue = Math.max(...Object.values(data));
    const scale = this.chartHeight / maxValue;

    const result = Object.entries(data)
      .map(([key, value]) => {
        const percent = ((value / maxValue) * 100).toFixed(0);

        return `<div style="--value: ${Math.floor(
          value * scale
        )}" data-tooltip="${`<span>
        <small>${key.toLocaleString("default", { dateStyle: "medium" })}</small>
        <br>
        <strong>${percent}%</strong>
      </span>`}"></div>`;
      })
      .join("");

    return result;
  }

  async update(from, to) {
    this.element.classList.add("column-chart_loading");

    const data = await this.downloadData(from, to);
    this.range.from = from;
    this.range.to = to;

    if (data) {
      this.subElements.header.textContent = this.formatHeading(
        Object.values(data).reduce((sum, elem) => sum + elem, 0)
      );
      this.subElements.body.innerHTML = this.getColumnProps(data);

      this.element.classList.remove("column-chart_loading");
    }

    return data;
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    this.remove();
  }
}
