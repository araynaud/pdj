var pdjConfig = 
{
	defaultTitle: "Piment du Jour",
	pdjApi: 
	{
		root: "/api/",
		recipeDetails: "Recipes/GetRecipeDetails?recipeId"
	},
	MediaThingy:
	{
		root: "/mt",
		imagesRoot: "images"
	},
	images:
	{
		root: "/images",
		dir: "RecipeImages",
		subdirs: ["", "tn", "ss"],
		idDir: true,
		default: "nophoto.jpg",
		background:"/images/fall_leaves.jpg"
	},
	share:
	{
		twitter: "https://twitter.com/intent/tweet?url={0}&text={1}&via={2}",
		facebook: "https://www.facebook.com/sharer/sharer.php?u={0}"
	}
};
