const fs = require('node:fs');
const query = `query GetShopAds($orderType: AdOrderEnum, $first: Int, $after: String, $keywords: String, $filters: AdFilterInput!) {
  ShopAds: ads(source: MOBILE, filters: $filters, orderType: $orderType, first: $first, after: $after, keywords: $keywords) {
    edges { node { id legacyResourceId title price updatedAt path region kinds photo { url } status shop { id name uri } } cursor }
    pageInfo { endCursor hasNextPage }
    totalCount
  }
}`;
(async () => {
  const response = await fetch('https://tap.az/graphql', {
    method: 'POST',
    headers: {'content-type': 'application/json', accept: 'application/json', origin: 'https://tap.az', referer: 'https://tap.az/shops/nerj_metal?user_id=16790475', 'user-agent': 'Mozilla/5.0'},
    body: JSON.stringify({operationName:'GetShopAds', query, variables:{first:50, after:null, keywords:null, orderType:'VIPPED_AT_DESC', filters:{userLegacyId:'16790475', isShop:true}}})
  });
  const text = await response.text();
  console.log(response.status, response.url, text.slice(0, 1000));
  fs.writeFileSync('shop-graphql.json', text);
})().catch((error) => { console.error(error); process.exitCode = 1; });
