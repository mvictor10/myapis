let dados = [];

    async function carregarDados() {
      const response = await fetch('https://mvictor10.github.io/myapis/municipio_irece.json');
      dados = await response.json();
    }

    function buscar() {
      const termo = document.getElementById("searchInput").value.trim().toLowerCase();
      const resultsDiv = document.getElementById("results");
      resultsDiv.innerHTML = "";

      if (!termo) return;

      const encontrados = dados.filter(item =>
        item.cep.includes(termo) || item.logradouro.toLowerCase().includes(termo)
      );

      if (encontrados.length === 0) {
        resultsDiv.innerHTML = "<p class='not-found'>Nenhum resultado encontrado.</p>";
        return;
      }

      encontrados.forEach(endereco => {
        resultsDiv.innerHTML += `
          <div class="item">
            <p><strong>Logradouro:</strong> ${endereco.logradouro}</p>
            <p><strong>Bairro:</strong> ${endereco.bairro}</p>
            <p><strong>CEP:</strong> ${endereco.cep}</p>
            <p><strong>Localidade:</strong> ${endereco.localidade}</p>
            <p><strong>UF:</strong> ${endereco.uf}</p>
            <p><strong>Estado:</strong> ${endereco.estado}</p>
            <p><strong>Região:</strong> ${endereco.regiao}</p>
            <p><strong>DDD:</strong> ${endereco.ddd}</p>
          </div>
        `;
      });
    }

    // Carregar os dados ao iniciar
    carregarDados();
