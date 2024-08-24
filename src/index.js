<script>
  import { onMount, onDestroy } from 'svelte';
  import { writable } from 'svelte/store';

  const scrapedData = writable([]);
  const connectionStatus = writable('Disconnected');
  const error = writable(null);

  let socket;

  function connectWebSocket() {
    socket = new WebSocket('wss://your-vercel-deployment-url.vercel.app/scrape');

    socket.onopen = () => {
      connectionStatus.set('Connected');
      error.set(null);
      socket.send("Start scraping");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.error) {
          error.set(data.error);
        } else {
          scrapedData.set(data);
          error.set(null);
        }
      } catch (e) {
        error.set('Failed to parse server response');
      }
    };

    socket.onclose = (event) => {
      if (event.wasClean) {
        connectionStatus.set(`Disconnected: ${event.reason}`);
      } else {
        connectionStatus.set('Connection died');
      }
    };

    socket.onerror = (error) => {
      error.set(`WebSocket Error: ${error.message}`);
    };
  }

  function disconnectWebSocket() {
    if (socket) {
      socket.close();
    }
  }

  onMount(() => {
    connectWebSocket();
  });

  onDestroy(() => {
    disconnectWebSocket();
  });
</script>

<main>
  <h1>Hotel Scraper</h1>
  <p>Status: {$connectionStatus}</p>
  {#if $error}
    <p class="error">{$error}</p>
  {/if}
  
  <button on:click={connectWebSocket} disabled={$connectionStatus === 'Connected'}>
    Connect and Start Scraping
  </button>
  
  <button on:click={disconnectWebSocket} disabled={$connectionStatus !== 'Connected'}>
    Disconnect
  </button>

  {#if $scrapedData.length > 0}
    <h2>Scraped Data:</h2>
    <ul>
      {#each $scrapedData as hotel}
        <li>
          <strong>{hotel.name}</strong> - {hotel.location}<br>
          Room: {hotel.roomType}, Meal Plan: {hotel.mealPlan}<br>
          Price: {hotel.price} {hotel.currency}
        </li>
      {/each}
    </ul>
  {:else}
    <p>No data scraped yet.</p>
  {/if}
</main>

<style>
  .error {
    color: red;
  }
</style>