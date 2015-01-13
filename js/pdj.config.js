if(!pdjApp) pdjApp = {};
pdjApp.config = {
	defaultTitle: "PDJ local",
	pdjApiRoot: "/pdj/api/",
	pdjApiRoot: "/proxy.php/www.pimentdujour.com/api/",
//	offline: true,
	MediaThingyRoot: "/mt",
	images: {
		root: "/pictures",
		dir: "RecipeImages",
	},
	recipeIdDir: true,
	defaultImage: "nophoto.jpg",
	backgroundImage: "/pictures/web/renards_files/18fox-magnifiques-7364.jpg",
	subdirs: ["", "tn", "ss"],
	share: {
		twitter: "https://twitter.com/intent/tweet?url={0}&text={1}&via={2}",
		facebook: "https://www.facebook.com/sharer/sharer.php?u={0}"
	}
};
