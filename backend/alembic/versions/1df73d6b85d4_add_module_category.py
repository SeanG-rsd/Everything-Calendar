"""add module category

Revision ID: 1df73d6b85d4
Revises: ce5feef0b2a5
Create Date: 2026-07-10 22:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '1df73d6b85d4'
down_revision: Union[str, None] = 'ce5feef0b2a5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'modules',
        sa.Column('category', sa.String(), nullable=False, server_default='list'),
    )
    op.alter_column('modules', 'category', server_default=None)


def downgrade() -> None:
    op.drop_column('modules', 'category')
