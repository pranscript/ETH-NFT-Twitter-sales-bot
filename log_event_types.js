const transferEventTypes = [
    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', // Transfer
  ];
  
  const saleEventTypes = [
    '0xe2c49856b032c255ae7e325d18109bc4e22a2804e2e49a017ec0f59f19cd447b', // EvProfit (X2Y2)
    '0x95fb6205e23ff6bda16a2d1dba56b9ad7c783f67c96fa149785052f47696f2be', // TakerBid (LooksRare)
    '0x68cd251d4d267c6e2034ff0088b990352b97b2002c0476587d0c4da889c11330', // TakerAsk (LooksRare)
    '0x9d9af8e38d66c62e2c12f0225249fd9d721c54b83f48d9352c97c6cacdcb6f31', // OrderFulfilled (Opensea Seaport)
    '0x61cbb2a3dee0b6064c2e681aadd61677fb4ef319f0b547508d495626f5a62f64', // OrdersMatched (Blur)
    '0x1d5e12b51dee5e4d34434576c3fb99714a85f57b0fd546ada4b0bddd736d12b2', // Execution721Packed (Blur)
    '0x7dc5c0699ac8dd5250cbe368a2fc3b4a2daadb120ad07f6cccea29f83482686e', // Execution721MakerFeePacked (Blur)
    '0x0fcf17fac114131b10f37b183c6a60f905911e52802caeeb3e6ea210398b81ab' // Execution721TakerFeePacked (Blur)
  ];
  
  module.exports = {
    transferEventTypes: transferEventTypes,
    saleEventTypes: saleEventTypes,
  };
  
  