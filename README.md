# create-spanion-app

Generate projects from repos using CLI.  

Using this simple cli tool, you can copy any public repo and use it as a template for your project.  
This also has bunch of my templates baked in, which can be used.

## Usage

Install globally using `npm i -g create-spanion-app` then use `create-spanion-app <commands>` to run the CLI tool.
It can also be used without installation `npx create-spanion-app <commands>`.

> The shorthand `csa` can be substituted for `create-spanion-app` for e.g.  is `npx csa -t tanstack`.

This tool takes these two arguments: 

##### Template *`-t`* 
Specifies to use the inbuilt template.
`npx csa -t frontend`
`npx csa -t svelte`  

##### Repo *`-r`*
Specifies to use any public repo.
`npx csa -r https://github.com/AKAspanion/nextjs-template.git`

## Other Examples
To use current folder.
`npx csa . -t frontend`  

To use specified project folder.
`npx csa my-app -t frontend`

## Available Templates
- mfe-react
- tanstack
- frontend
- backend
- svelte
- nextjs

## License

MIT © [AKAspanion](https://github.com/AKAspanion)