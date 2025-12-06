import 'grist-plugin-api';

// Grist boilerplate
grist.ready();

grist.onRecords((records) => {
  console.log(records);
});

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <h1>Widget One</h1>
  </div>
`;
