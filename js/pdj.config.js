var pdjConfig = 
{
	defaultTitle: "PDJ local",
	offline: true,
	pdjApi:
	{
		root: "/proxy.php/www.pimentdujour.com/api/",
		proxy: "/proxy.php",
		"recipeDetails": "Recipes/GetRecipeDetails?recipeId",
		offline: { recipeDetails: "json/GetRecipeDetails.json" }
	},
	MediaThingy: {root: "/mt"},
	images: 
	{
		root: "/pictures",
		dir: "RecipeImages",
		subdirs: ["", "tn", "ss"],
		idDir: true,
		default: "nophoto.jpg",
		background: "/pictures/web/renards_files/18fox-magnifiques-7364.jpg"
	},
	share:
	{
		twitter: "https://twitter.com/intent/tweet?url={0}&text={1}&via={2}",
		facebook: "https://www.facebook.com/sharer/sharer.php?u={0}"
	}
};
