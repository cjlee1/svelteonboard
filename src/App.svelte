<script>
 
  import { Swipe, SwipeItem } from "svelte-swipe"; // gzipped 3.37 KB
  import {fade,slide} from 'svelte/transition';
  import Nfcpage from './nfcpage.svelte';
  import Screen1 from './screen1.svelte';
  import Screen2 from './screen2.svelte';

  let nfcPage= true;
 
  let showIndicators = true;
  let transitionDuration = 1000; //ms
 
</script> 
 
<style>
	:root{
	--sv-swipe-panel-height: inherit;
	--sv-swipe-panel-width: inherit;
	--sv-swipe-panel-wrapper-index: 2;
	--sv-swipe-indicator-active-color: white;
	}
	.swipe-holder{
	height: 70vh;
	width: 100%;
	display: flex; 	
	margin: auto; 
	margin: auto; /* Important */ 
	text-align: center;
	background: RGB(7,10,27);
	}
	:global(body) {
		padding:0px ;
	}
	img{
	max-width: 100%;
	height: auto;
	}
	.has-pointer-event{
	pointer-events:fill;
	}
	h1{
		font-size: 20px;
		color: white;
	}
	p{
		font-style: Arial;
		font-size: 13px;
		color: white;
		padding-left: 24%;
		padding-right: 24%;
	}
	button{
		background:RGB(236,71,129);
		color: white;
		border: 1px solid RGB(236,71,129);
			border-radius: 10px;
		padding-left: 6%;
		padding-right: 6%;
	}
	h1,p,button,div {
		text-align: center !important;
		display: flex;
		justify-content: center;
	}

	.header{
		background: RGB(7,10,27);

	}
	.header img{
		width: 40vw;
		height:5vh;
		padding-top:2vh;
		padding-bottom:2vh;
	}
	.bottom{
		background: RGB(7,10,27);
		height:20vh;
	}
	.bottom h2{
		color:RGB(236,71,129);
		font-size : 13px;
	}
	 div.bottom:last-of-type{
 
	  	display: inline-block;
  		width: 100%;
	}
	
	h2 span{
		color:RGB(236,71,129);
		font-size : 13px;
	}
	.skiptour{  
		background: none!important;
  		border: none;
  		padding: 0!important;
		cursor: pointer;
		color:RGB(236,71,129);
	}
</style> 

 {#if nfcPage}
 <!--this is the sliding carousel part -->
	<div class = "header"><img src="./images/white.png" alt=""></div>
		
	<div class="swipe-holder">
		<Swipe {showIndicators}  {transitionDuration}>
			<Screen1/>
			
			<Screen2/>
			<SwipeItem>
			<img src="./images/empower.png" alt="">

					<h1>Assess</h1>
					<p> References and training checklists provide real-time assesment and employmee support.</p>
					<div class="button">
						<button class="has-pointer-event" on:click="{() => nfcPage = false}" >Finish</button>
			</div>
			</SwipeItem>	
		</Swipe>

	</div>

	<div class="bottom">
		<div>
			<h2><button class="skiptour" href="" on:click="{() => nfcPage = false}" >Skip tour</button></h2>
		</div>
		<div>
			<h2 class= "login" style="color:white">Already a user? <a href=""><span> Login</span></a>  </h2>
		</div>
	</div>
{:else}

	<Nfcpage />

{/if}
