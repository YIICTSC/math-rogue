const readState = async (tab) => tab.playwright.evaluate(() => ({
  body: document.body.innerText,
  buttons: [...document.querySelectorAll('button')].map((button, index) => ({
    index,
    text: (button.innerText || '').trim().replace(/\s+/g, ' '),
    disabled: button.disabled,
  })),
  roles: [...document.querySelectorAll('[role="button"],button')].map((element, index) => ({
    index,
    text: (element.innerText || '').trim().replace(/\s+/g, ' '),
    disabled: Boolean(
      element.disabled
      || element.getAttribute('aria-disabled') === 'true'
      || Number(getComputedStyle(element).opacity) < 0.75
    ),
  })),
}));

const clickRoleAt = async (tab, index) => {
  const roles = tab.playwright.getByRole('button');
  const count = await roles.count();
  if (index < 0 || index >= count) throw new Error(`role index mismatch: ${index}/${count}`);
  await roles.nth(index).click();
};

const clickDomButtonAt = async (tab, index) => {
  const buttons = tab.playwright.locator('button');
  const count = await buttons.count();
  if (index < 0 || index >= count) throw new Error(`button index mismatch: ${index}/${count}`);
  await buttons.nth(index).click();
};

export const advanceE2E = async (tab, maxSteps = 25) => {
  const log = [];
  for (let step = 0; step < maxSteps; step += 1) {
    // Browser QA policy: refresh the accessibility snapshot before every interaction.
    await tab.playwright.domSnapshot();
    const state = await readState(tab);
    const { body } = state;

    if (/Congratulations on Graduating|Congratulations!|Game Clear!|Dawn of Wishes/i.test(body)
      && /Back to Title|Become a Legend|End Adventure/i.test(body)) {
      log.push({ step, ending: body.slice(0, 260) });
      break;
    }
    if (body.includes('Enemy Turn')) {
      await new Promise((resolve) => setTimeout(resolve, 250));
      continue;
    }

    let domIndex = -1;
    let roleIndex = -1;
    let label = '';
    for (const text of ['Got it', 'Start Adventure!', 'Next', 'Continue', 'Depart', 'Open', 'Leave', 'Skip']) {
      const button = state.buttons.find((candidate) => !candidate.disabled && candidate.text === text);
      if (button) {
        domIndex = button.index;
        label = text;
        break;
      }
    }
    if (domIndex < 0 && body.includes('Continue Without Taking More >>')) {
      const button = state.buttons.find((candidate) => !candidate.disabled && candidate.text === 'Continue Without Taking More >>');
      if (button) {
        domIndex = button.index;
        label = button.text;
      }
    }
    if (domIndex < 0 && body.includes('SELECT YOUR NEXT DESTINATION.')) {
      roleIndex = state.roles.length - 1;
      label = 'map';
    }
    if (domIndex < 0 && roleIndex < 0 && body.includes('End Turn') && body.includes('Your Turn')) {
      const attack = state.roles.find((candidate) => candidate.index > 4
        && !candidate.disabled
        && /Deal \d+ damage/i.test(candidate.text)
        && /Attack\s*$/.test(candidate.text));
      const endTurn = state.roles.find((candidate) => candidate.text === 'End Turn');
      roleIndex = attack?.index ?? endTurn?.index ?? -1;
      label = attack ? 'attack' : 'end-turn';
    }
    if (domIndex < 0 && roleIndex < 0 && body.includes('After-School Exploration')) {
      const infirmary = state.roles.find((candidate) => candidate.text.startsWith('Infirmary'));
      if (infirmary) {
        roleIndex = infirmary.index;
        label = 'infirmary';
      }
    }
    if (domIndex < 0 && roleIndex < 0 && body.includes('Final Awakening')) {
      roleIndex = 0;
      label = 'final-power';
    }
    if (domIndex < 0 && roleIndex < 0 && body.includes('Lost Item')) {
      const pickup = state.roles.find((candidate) => candidate.text.startsWith('Pick Up'));
      if (pickup) {
        roleIndex = pickup.index;
        label = 'pickup';
      }
    }
    if (domIndex < 0 && roleIndex < 0 && state.roles.length === 3 && !body.includes('Learning Rogue')) {
      roleIndex = 0;
      label = 'event';
    }
    if (domIndex < 0 && roleIndex < 0) {
      log.push({ step, stop: body.slice(0, 380) });
      break;
    }

    try {
      if (roleIndex >= 0) await clickRoleAt(tab, roleIndex);
      else await clickDomButtonAt(tab, domIndex);
      log.push({ step, label });
    } catch (error) {
      // Victory/reward transitions can replace the target between inspection and click.
      log.push({ step, race: label, message: String(error).slice(0, 120) });
    }
    await new Promise((resolve) => setTimeout(resolve, 130));
  }
  return log;
};

export const startQaRun = async (tab, modeName, characterIndex = 0) => {
  await tab.playwright.domSnapshot();
  const modeButton = tab.playwright.getByRole('button', { name: modeName, exact: true });
  if (await modeButton.count() !== 1) throw new Error(`mode button not unique: ${modeName}`);
  await modeButton.click();

  await tab.playwright.domSnapshot();
  const startButton = tab.playwright.getByRole('button', { name: 'Start Adventure', exact: true });
  if (await startButton.count() !== 1) throw new Error('Start Adventure button not unique');
  await startButton.click();

  await tab.playwright.domSnapshot();
  let body = (await readState(tab)).body;
  if (body.includes('Saved Adventure Found')) {
    const startOver = tab.playwright.getByRole('button', { name: 'Start Over', exact: true });
    if (await startOver.count() !== 1) throw new Error('Start Over button not unique');
    await startOver.click();
    await tab.playwright.domSnapshot();
    body = (await readState(tab)).body;
  }
  if (body.includes('Mode Select')) {
    const settings = tab.playwright.getByRole('button', { name: 'Start with These Settings', exact: true });
    if (await settings.count() !== 1) throw new Error('settings button not unique');
    await settings.click();
    await tab.playwright.domSnapshot();
    body = (await readState(tab)).body;
  }
  if (body.includes('Choose Game Difficulty')) {
    const roles = tab.playwright.getByRole('button');
    const names = await roles.allTextContents();
    const difficultyIndex = names.findIndex((text) => text.trim().startsWith('Difficulty 1'));
    await clickRoleAt(tab, difficultyIndex);
    await tab.playwright.domSnapshot();
    body = (await readState(tab)).body;
  }
  if (body.includes('Choose Character')) {
    const effectiveCharacterIndex = modeName === 'Magic Mode' ? characterIndex + 2 : characterIndex;
    await clickRoleAt(tab, effectiveCharacterIndex);
    await tab.playwright.domSnapshot();
    body = (await readState(tab)).body;
  }
  if (body.includes('The Journey Begins')) await clickRoleAt(tab, 0);
  if (body.includes('Choose a Starting Relic')) await clickRoleAt(tab, 0);
};

export const dismissTitleOverlays = async (tab) => {
  await tab.playwright.domSnapshot();
  const ok = tab.playwright.getByRole('button', { name: 'OK', exact: true });
  if (await ok.count() === 1) await ok.click();

  await tab.playwright.domSnapshot();
  const decideLater = tab.playwright.getByRole('button', { name: 'Decide Later', exact: true });
  const decideLaterCount = await decideLater.count();
  if (decideLaterCount === 2) await decideLater.nth(1).click();
};

export const finishHighSchoolEnding = async (tab) => {
  await tab.playwright.domSnapshot();
  const backToTitle = tab.playwright.getByRole('button', {
    name: 'Become a Legend (Back to Title)',
    exact: true,
  });
  if (await backToTitle.count() !== 1) throw new Error('high-school ending button not unique');
  await backToTitle.click();
};
