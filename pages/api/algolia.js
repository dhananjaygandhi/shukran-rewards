import algoliasearch from "algoliasearch";
import _get from "lodash/get";

const algoliaSearchApi = props => {
  const client = algoliasearch(
    process.env.NEXT_PUBLIC_ALGOLIAAPPID,
    process.env.NEXT_PUBLIC_ALGOLIAAPIKEY
  );
  const algoliaProductIndex = process.env.NEXT_PUBLIC_ALGOLIAPRODUCTINDEX;
  const index = client.initIndex(algoliaProductIndex);
  const maxPrice = _get(props, 'maxPrice', 0);
  try {
    const content = index.search('*', {
      facets: ['categoryFacetValue.en', 'categoryFacetValue.ar'],
      page: 0,
      hitsPerPage: 48,
      attributesToRetrieve: "inStock,concept,color,manufacturerName,url,reviewAvgRating,333WX493H,345WX345H,505WX316H,550WX550H,499WX739H,badge,baseProductId,name,summary,wasPrice,price,employeePrice,showMoreColor,productType,childDetail,sibiling,thumbnailImg,gallaryImages,isConceptDelivery,extProdType,extProdCode,itemType,flashSaleData",
      attributesToHighlight: ['name'],
      maxValuesPerFacet: 100,
      getRankingInfo: true,
      facetFilters: ['inStock:1', 'approvalStatus:1'],
      numericFilters: [`price > ${_get(props, "payload.minimumPrice", 0)}`],
      numericFilters: [[`price:0 TO ${maxPrice}`]],
      clickAnalytics: true,
      // analyticsTags: [_get(props, 'payload.lang', 'en')]
    });
    return content;
  } catch (err) {
    throw new Error(JSON.stringify(err));
  }
};

export default algoliaSearchApi;
