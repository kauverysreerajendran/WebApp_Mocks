"""tailor break time

Revision ID: b7c1d2e3f4a5
Revises: 70306c652a86
Create Date: 2026-10-08 15:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7c1d2e3f4a5'
down_revision: Union[str, None] = '70306c652a86'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('tailors', sa.Column('break_start', sa.String(length=5), nullable=True))
    op.add_column('tailors', sa.Column('break_end', sa.String(length=5), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('tailors') as batch:
        batch.drop_column('break_end')
        batch.drop_column('break_start')
