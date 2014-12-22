if(!pdjApp) pdjApp = {};
pdjApp.config = {
	defaultTitle: "Piment du Jour",
	pdjApiRoot: "/api/",
	MediaThingyRoot: "/mt",
	imagesRoot: "/",
	imagesDir: "images/RecipeImages",
	recipeIdDir: true,
	defaultImage: "nophoto.jpg",
	backgroundImage:"/images/fall_leaves.jpg",
	subdirs: ["", "tn", "ss"],
	share: {
		twitter: "https://twitter.com/intent/tweet?url={0}&text={1}&via={2}",
		facebook: "https://www.facebook.com/sharer/sharer.php?u={0}"
	}
};
