<script>
 
    import { Swipe, SwipeItem } from "svelte-swipe"; // gzipped 3.37 KB
    import {fade,slide} from 'svelte/transition';
    import Modal from './Modal.svelte';

    let showModal = false;
 
</script> 
<style>
  
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
</style>

<!-- this is the nfc part -->
<div transition:fade class = "header" style="background:white;"><img src="./images/color.png" alt=""></div>
	<img transition:fade style="margin-left:auto;margin-right:auto;display:block;" src="./images/no_nfc.png" alt="">

		<h1 transition:fade style = "color:black;">Enable NFC reader</h1>
		<p  transition:fade style = "color:black;"> Open the NFC reader on your iPhone to read the tag.</p>
		<div  transition:fade class="button">
			<button class="has-pointer-event" on:click="{() => showModal = true}">Open Reader</button>
		</div>

	
<div  transition:fade class="bottom"  style= "background:white;">
	
	
<div transition:fade >
	<h2 class= "login" style="color:black;position: absolute;bottom: 5%;left: 34%;">Already a user? <a href=""><span> Login</span></a>  </h2>
	
</div>
	
	<div transition:fade style="position: absolute;bottom: 0px;left: 34%;"><h2>About Smart Access</h2> </div>

	
</div>

<!--this is the slide up modal -->
{#if showModal}
	<Modal  on:close="{() => showModal = false}">
		<h2 slot="header" style="text-align:center;margin-top: 0px;margin-bottom: 0px;">
			Ready to Scan
		</h2>
<img transition:fade style="margin-left:auto;margin-right:auto;display:block;max-width:100px; max-height:5%;" src="./images/nfc-tag.png" alt="">

		
		<p  transition:fade style = "color:black;padding-left:0;padding-right:0;"> Hold your device near the tag to scan it.</p>
		<div  transition:fade class="button">
			<button class="has-pointer-event" on:click="{() => showModal = false}">Cancel</button>
		</div>
	</Modal>
{/if}