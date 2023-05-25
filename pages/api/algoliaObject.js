import algoliasearch from "algoliasearch";
import _get from "lodash/get";

const algoliaObjectApi = props => {
  const client = algoliasearch(
    process.env.NEXT_PUBLIC_ALGOLIAAPPID,
    process.env.NEXT_PUBLIC_ALGOLIAAPIKEY
  );
  const algoliaProductIndex = process.env.NEXT_PUBLIC_ALGOLIAPRODUCTINDEX;

  const index = client.initIndex(algoliaProductIndex);
  const objectIDs = [`objectID:${_get(props, "pid", "")}`];
  try {
    const content = index.search("", {
      facetFilters: ['inStock:1', 'approvalStatus:1', objectIDs],
      attributesToRetrieve: "inStock,concept,color,manufacturerName,url,reviewAvgRating,333WX493H,345WX345H,505WX316H,550WX550H,499WX739H,badge,baseProductId,name,summary,wasPrice,price,employeePrice,showMoreColor,productType,childDetail,sibiling,thumbnailImg,gallaryImages,isConceptDelivery,extProdType,extProdCode,itemType,flashSaleData",
      clickAnalytics: true
    });
    return content;
  } catch (err) {
    throw new Error(JSON.stringify(err));
  }
};

export default algoliaObjectApi;
