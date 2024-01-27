export const generateDiscordMessage = (
  address: string,
  url: URL,
  listingType: "Sale" | "Rental"
) => {
  return {
    embeds: [
      {
        color: listingType === "Sale" ? 15844367 : 15277667,
        title: `For ${listingType}: ${address}`,
        url: url.toString(),
      },
    ],
  };
};
