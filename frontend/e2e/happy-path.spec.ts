import { expect, test } from '@playwright/test'

test('two players can play a move, get routed to the forced board, and start a new game', async ({
  page,
}) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Ultimate Tic-Tac-Toe' })).toBeVisible()
  await expect(page.getByRole('status')).toHaveText("X's turn")

  // X plays the center cell of the center board, forcing O into that same board.
  const centerBoard = page.getByRole('group', { name: /Small board 5/ })
  await centerBoard.getByRole('button', { name: 'Board 5, middle center cell' }).click()

  await expect(page.getByRole('status')).toHaveText("O's turn")
  await expect(page.getByRole('group', { name: 'Small board 5, your move' })).toBeVisible()

  // Every board other than 5 should now be disabled.
  await expect(page.getByRole('button', { name: 'Board 1, top left cell' })).toBeDisabled()

  await page.getByRole('button', { name: 'New Game' }).click()
  await expect(page.getByRole('status')).toHaveText("X's turn")
  await expect(page.getByRole('button', { name: 'Board 5, middle center cell' })).toBeEnabled()
})
